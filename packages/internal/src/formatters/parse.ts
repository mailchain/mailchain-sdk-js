import { ALL_PROTOCOLS, ProtocolType } from '@mailchain/addressing';
import { publicKeyFromBytes, PublicKey } from '@mailchain/crypto';
import { decodeBase64, decodeHexZeroX, encodeUtf8 } from '@mailchain/encoding';
import { HEADER_LABELS } from '@mailchain/message-composer';
import { MailAddress, MailData } from '../transport';
import { X_IDENTITY_KEYS } from './consts';
import { simpleMimeHeaderParser } from './simpleMimeHeaderParser';

type MimeHeaderValue = {
	value: string;
	params: { [key: string]: string | undefined };
	initial: string;
};

type MimeNode = {
	content?: string;
	contentType?: MimeHeaderValue;
	contentTransferEncoding?: MimeHeaderValue;
	headers: { [key: string]: [MimeHeaderValue | undefined] };
	raw: string;
	childNodes: MimeNode[];
};

type ExtractedContent = {
	messages: { [contentType: string]: string | undefined };
	attachments: any[];
};

function decodeNodeContent(node: MimeNode): string | Uint8Array {
	const [, rawContent] = node.raw.split('\n\n');

	let decodedContent: Uint8Array | null = null;

	if (node.contentTransferEncoding) {
		switch (node.contentTransferEncoding.value.toLowerCase()) {
			case 'base64':
				decodedContent = decodeBase64(rawContent);
				break;
			case '7bit':
				// Simple 7-bit ASCII, no decoding and processing needed
				try {
					// Note: the `decodeURIComponent` is legacy leftover to handle legacy implementation the characters were encoded using encodeURIComponent
					return decodeURIComponent(rawContent);
				} catch (e) {
					return rawContent;
				}
			default:
				throw new Error(`unsupported content transfer encoding [${node.contentTransferEncoding.value}]`);
		}
	}

	if (decodedContent == null) {
		throw new Error('could not extract decodedContent from rawContent');
	}

	switch (node.contentType?.params?.charset?.toUpperCase()) {
		case 'UTF-8':
			return encodeUtf8(decodedContent);
		case undefined:
			return decodedContent;
		default:
			throw new Error(`unsupported content charset [${node.contentType?.params?.charset}]`);
	}
}

function extractContent(nodes: MimeNode[]): ExtractedContent {
	const extracted: ExtractedContent = { messages: {}, attachments: [] };
	for (const node of nodes) {
		const { contentType, headers } = node;

		if (contentType?.value === 'multipart/alternative') {
			const childContent = extractContent(node.childNodes);
			extracted.messages = { ...childContent.messages, ...extracted.messages };

			// Note: there probably won't be attachments in multipart/alternative
			extracted.attachments = [...extracted.attachments, ...childContent.attachments];
		} else if (contentType?.value === 'text/plain' || contentType?.value === 'text/html') {
			const content = decodeNodeContent(node);
			if (typeof content !== 'string') throw new Error('cannot process message content being non-string');
			extracted.messages = { ...extracted.messages, [contentType.value]: content };
		} else if (headers['content-disposition']?.[0]?.value === 'attachment') {
			// TODO: This is some attachment WIP code, it doesn't work!
			const content = decodeNodeContent(node);
			if (typeof content === 'string') throw new Error('cannot process attachment content being string');
			extracted.attachments.push(content);
		}
	}
	return extracted;
}

export type ParseMimeTextResult = {
	mailData: MailData;
	addressIdentityKeys: Map<string, { identityKey: PublicKey; protocol: ProtocolType; network?: string }>;
};

export async function parseMimeText(content: Buffer): Promise<ParseMimeTextResult> {
	const parse = (await import('emailjs-mime-parser')).default;
	const text = content.toString('utf-8');
	const headersMap = simpleMimeHeaderParser(text);

	const parsedParticipants = await parseParticipants(headersMap);

	const parsedMessage: MimeNode = parse(text);
	const { headers }: any = parsedMessage;

	const addressIdentityKeys = parseIdentityKeys(headersMap.get(X_IDENTITY_KEYS) ?? '');

	const extractedContent =
		parsedMessage.childNodes.length > 0
			? extractContent(parsedMessage.childNodes)
			: extractContent([parsedMessage]);

	const mailData: MailData = {
		id: parseMessageId(headers['message-id'][0].initial),
		date: new Date(headers['date'][0].value),
		...parsedParticipants,
		subject: parseSubjectHeader(headers.subject?.[0].initial),
		plainTextMessage: extractedContent.messages['text/plain']!,
		message: extractedContent.messages['text/html']!,
	};

	return { mailData, addressIdentityKeys };
}

async function parseParticipants(
	headers: Map<string, string>,
): Promise<Pick<MailData, 'from' | 'recipients' | 'carbonCopyRecipients' | 'blindCarbonCopyRecipients' | 'replyTo'>> {
	const { parseOneAddress, parseAddressList } = (await import('email-addresses')).default;

	const fromValue = headers.get(HEADER_LABELS.From);
	const parsedFrom = parseOneAddress({ input: fromValue ?? '', rfc6532: true, rejectTLD: true });
	if (parsedFrom == null) throw new Error(`message doesn't include valid 'from' header field [${fromValue}]`);
	const from: MailAddress = isParsedMailbox(parsedFrom)
		? { name: parsedFrom.name ?? '', address: parsedFrom.address }
		: { name: parsedFrom.name, address: parsedFrom.addresses[0].address };

	const replyTooValue = headers.get(HEADER_LABELS.ReplyTo);
	const parsedReplyTo = parseOneAddress({ input: replyTooValue ?? '', rfc6532: true, rejectTLD: true });
	let replyTo: MailAddress | undefined = undefined;
	if (parsedReplyTo != null) {
		replyTo = isParsedMailbox(parsedReplyTo)
			? { name: parsedReplyTo.name ?? '', address: parsedReplyTo.address }
			: { name: parsedReplyTo.name, address: parsedReplyTo.addresses[0].address };
	}

	function parseAddresses(headerLabel: string): MailAddress[] {
		const result: MailAddress[] = [];
		const headerValue = headers.get(headerLabel);
		if (headerValue != null) {
			const parsedAddresses = parseAddressList({ input: headerValue, rfc6532: true, rejectTLD: true }) ?? [];
			for (const address of parsedAddresses) {
				if (isParsedMailbox(address)) {
					result.push({ name: address.name ?? '', address: address.address });
				} else {
					result.push(
						...address.addresses.map((a) => ({ name: a.name ?? address.name, address: a.address })),
					);
				}
			}
		}
		return result;
	}

	const recipients = parseAddresses(HEADER_LABELS.To);
	const carbonCopyRecipients = parseAddresses(HEADER_LABELS.Cc);
	const blindCarbonCopyRecipients = parseAddresses(HEADER_LABELS.Bcc);

	return { from, replyTo, recipients, carbonCopyRecipients, blindCarbonCopyRecipients };
}

function isParsedMailbox(
	mailboxOrGroup: emailAddresses.ParsedMailbox | emailAddresses.ParsedGroup,
): mailboxOrGroup is emailAddresses.ParsedMailbox {
	return mailboxOrGroup.type === 'mailbox';
}

function parseMessageId(messageIdHeader: string): string {
	if (messageIdHeader.startsWith('<') && messageIdHeader.endsWith('>')) {
		return messageIdHeader.slice(1, -1);
	}
	return messageIdHeader;
}

function parseSubjectHeader(rawSubject: string): string {
	// Handle case when the subject header is not encoded
	if (!rawSubject.startsWith('=?')) return rawSubject;

	const lines = rawSubject.split('\t');

	// https://dmorgan.info/posts/encoded-word-syntax/
	// tl;dr if the subject conitans non ASCII characters, the subject is base64 encoded
	// Sample value: =?UTF-8?B?ZnVjayDwn5CO?=!
	// Parts: =?<charset>?<encoding>?<encoded-text>?=
	let encodedContent = '';
	let contentEncoding: string | null = null;
	let contentCharset: string | null = null;

	for (const line of lines) {
		const [, charset, encoding, encodedText] = line.split('?');
		if (contentEncoding == null) {
			contentEncoding = encoding;
		} else if (contentEncoding !== encoding) {
			throw new Error(`mixed encoding of subject lines, expected [${contentEncoding}], received [${encoding}]`);
		}

		if (contentCharset == null) {
			contentCharset = charset;
		} else if (contentCharset !== charset) {
			throw new Error(`mixed charset of subject lines, expected [${contentCharset}], received [${charset}]`);
		}

		encodedContent += encodedText;
	}

	let decodedContent: Uint8Array | null = null;
	if (contentEncoding === 'B') {
		decodedContent = decodeBase64(encodedContent);
	}

	let charsetEncodedContent: string | null = null;
	if (decodedContent) {
		if (contentCharset?.toUpperCase() === 'UTF-8') {
			charsetEncodedContent = encodeUtf8(decodedContent);
		}
	}

	// Note: to handle legacy, used to have incorrect subject formatting with encodeUriComponent(...). This is "best effort" to handle it.
	if (charsetEncodedContent && charsetEncodedContent.indexOf('%') > -1) {
		try {
			return decodeURIComponent(charsetEncodedContent);
		} catch (e) {
			// ignore it, not URI Component
		}
	}

	return charsetEncodedContent ?? encodedContent;
}

function parseIdentityKeys(attrStr: string): ParseMimeTextResult['addressIdentityKeys'] {
	const result: ParseMimeTextResult['addressIdentityKeys'] = new Map();

	for (const attrPairStr of attrStr.split(';')) {
		// attrPairStr: alice@mailchain.com="0x192382039fu89sdf82u893123:mailchain"
		const [attrKey, quotedValue] = attrPairStr.trim().split('=');
		if (attrKey == null || attrKey.length === 0 || quotedValue == null || quotedValue.length === 0) continue;
		const value = quotedValue.substring(1, quotedValue.length - 1); // remote the quotes from "0x192382039fu89sdf82u893123:mailchain"

		if (attrKey === 'v') {
			// This is the version attribute, example: v=1
			if (value !== '1') {
				console.warn(`unsupported ${X_IDENTITY_KEYS} version of [${value}]`);
				return new Map();
			}
		} else {
			const [encodedIdentityKey, protocol] = value.split(':');
			if (!ALL_PROTOCOLS.includes(protocol as ProtocolType)) {
				console.warn(`address [${attrKey}] has unsupported protocol [${protocol}]`);
			}
			try {
				const identityKey = publicKeyFromBytes(decodeHexZeroX(encodedIdentityKey));
				result.set(attrKey, { ...{ identityKey, protocol: protocol as ProtocolType } });
			} catch (e) {
				console.warn(
					`failed decoding identity key of address [${attrKey}] for value [${encodedIdentityKey}]`,
					e,
				);
			}
		}
	}

	return result;
}
