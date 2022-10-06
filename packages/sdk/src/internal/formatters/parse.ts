import { ALL_PROTOCOLS, ProtocolType } from '@mailchain/addressing';
import { decodePublicKey, PublicKey } from '@mailchain/crypto';
import { decodeBase64, decodeHexZeroX, encodeUtf8 } from '@mailchain/encoding';
import { X_IDENTITY_KEYS } from './conts';
import { MailData } from './types';

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

export async function parseMimeText(text: string): Promise<ParseMimeTextResult> {
	const parse = (await import('emailjs-mime-parser')).default;
	const parsedMessage: MimeNode = parse(text);
	const {
		headers,
		headers: { from, to, bcc, cc, subject },
	}: any = parsedMessage;

	const addressIdentityKeys = parseIdentityKeys(
		parsedMessage.headers[X_IDENTITY_KEYS.toLowerCase()]?.[0]?.initial ?? '',
	);

	const replyToHeader = headers['reply-to']?.[0]?.value?.[0];

	const extractedContent =
		parsedMessage.childNodes.length > 0
			? extractContent(parsedMessage.childNodes)
			: extractContent([parsedMessage]);

	const mailData: MailData = {
		id: headers['message-id'][0].value,
		date: new Date(headers['date'][0].value),
		from: { name: from[0].value[0].name, address: from[0].value[0].address },
		replyTo: replyToHeader ? { name: replyToHeader.name, address: replyToHeader.address } : undefined,
		recipients: to[0].value.map((it: any) => ({ name: it.name, address: it.address })),
		carbonCopyRecipients: cc?.[0].value.map((it: any) => ({ name: it.name, address: it.address })) ?? [],
		blindCarbonCopyRecipients: bcc?.[0].value.map((it: any) => ({ name: it.name, address: it.address })) ?? [],
		subject: parseSubjectHeader(subject?.[0].initial),
		plainTextMessage: extractedContent.messages['text/plain']!,
		message: extractedContent.messages['text/html']!,
	};

	return { mailData, addressIdentityKeys };
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
				const identityKey = decodePublicKey(decodeHexZeroX(encodedIdentityKey));
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
