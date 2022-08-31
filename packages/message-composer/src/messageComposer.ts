import { CRLF, HEADER_LABELS } from './consts';
import { buildMessageAndAttachments, BuiltContentPart } from './contentHandler';
import { concludeHeaders } from './fallback';
import { hasOnlyPrintableUsAscii } from './hasOnlyAscii';
import { createHeader } from './headerFactories';
import { buildHeaders } from './headerHandler';
import { byHeaderOrder } from './headerOrder';
import { defaultMessageComposerContext, MessageComposerContext } from './messageComposerContext';
import { Address, Attachment, ContentPart, Header, isAddressHeader } from './types';

/** The result from {@link MessageComposer#build}. */
export type ComposedMessage = {
	/**
	 * Built string message meant to be received (saved to Sent folder) by the sender.
	 *
	 * Warning: contains the 'Bcc' recipients and might be inappropriate to show this message to others.
	 */
	forSender: string;
	/**
	 * Built message meant to be sent to all the visible recipients such as 'To' and 'Cc'.
	 */
	forVisibleRecipients: string;
	/**
	 * Built message meant to be sent to each 'Bcc' individually. In the 'Bcc' header only their mailbox is shown.
	 *
	 * If you don't with to send these individually and opt to have one delivery for all the 'Bcc', it is ok to send the
	 * message from {@link ComposedMessage#forVisibleRecipients}, with the note of that might get marked as spam by mail clients.
	 */
	forBlindedRecipients: [Address, string][];
};

class MessageComposer {
	private readonly _headers: Map<string, Header<any>> = new Map();
	private readonly _messages: Map<string, ContentPart> = new Map();
	private readonly _attachments: ContentPart[] = [];

	constructor(private readonly _ctx: MessageComposerContext) {}

	/** Set the `Message-ID` field for the message. If not set, random one would be generated. */
	id(value: string): MessageComposer {
		this._headers.set(HEADER_LABELS.MessageId, { label: HEADER_LABELS.MessageId, value });
		return this;
	}

	/** Set the `Subject` filed for the message. If it consists of non US-ASCII characters, it will get encoded. */
	subject(value: string): MessageComposer {
		this._headers.set(HEADER_LABELS.Subject, { label: HEADER_LABELS.Subject, value });
		return this;
	}

	/** Set the `From` filed for the message. This is required field and must be set. */
	from(from: Address): MessageComposer {
		this._headers.set(HEADER_LABELS.From, { label: HEADER_LABELS.From, value: [from] });
		return this;
	}

	/**
	 * Set the recipients for the message based on the `type` parameter.
	 *
	 * Note: will override any pre-existing recipients for the given `type` when reinvoked with the same `type`.
	 */
	recipients(type: typeof HEADER_LABELS['To' | 'Cc' | 'Bcc'], ...recipients: Address[]): MessageComposer {
		this._headers.set(type, { label: type, value: [...recipients] });
		return this;
	}

	/** Set the Date field for the message. If not set, timestamp of the time invoking `build` will set. */
	date(value: Date): MessageComposer {
		this._headers.set(HEADER_LABELS.Date, { label: HEADER_LABELS.Date, value });
		return this;
	}

	/**
	 * Set your own header with its own value.
	 *
	 * @param label the label for the header, can be any string containing just US-ASCII printable characters (without white space characters).
	 * @param value the value for the header, can be any `string` or {@link Date} or {@link Address} array. Providing other type values will fail.
	 */
	customHeader<T>(label: string, value: T): MessageComposer {
		if (!hasOnlyPrintableUsAscii(label, false)) {
			throw new Error(
				`invalid header label [${label}]. Header label should be composed only of printable US-ASCII characters without WSC.`,
			);
		}
		this._headers.set(`custom-${label}`, { label, value });
		return this;
	}

	/**
	 * Set the content of the message for the defined type.
	 *
	 * @param type `"html"` will set the content for `text/html` and `"plain"` for `text/plain`
	 * @param content the content of the message. If `string` is provided, it needs to be already base64 encoded. If it is {@link Buffer} it will be encoded by the library.
	 */
	message(type: 'html' | 'plain', content: string | Buffer): MessageComposer {
		this._messages.set(type, {
			headers: [
				{ label: HEADER_LABELS.ContentType, value: `text/${type}`, attrs: [['charset', 'UTF-8']] },
				{ label: HEADER_LABELS.ContentTransferEncoding, value: 'base64' },
			],
			content,
		});
		return this;
	}

	/**
	 * Add new attachment to the message.
	 */
	attachment(attachment: Attachment): MessageComposer {
		this._attachments.push({
			headers: [
				createHeader(HEADER_LABELS.ContentType, attachment.contentType),
				createHeader(HEADER_LABELS.ContentDisposition, 'attachment', [['filename', attachment.filename]]),
				createHeader(HEADER_LABELS.ContentTransferEncoding, 'base64'),
				createHeader(HEADER_LABELS.ContentId, `<${attachment.cid}>`),
			],
			content: attachment.content,
		});
		return this;
	}

	/**
	 * Build the MIME message of the composed message.
	 */
	async build(): Promise<ComposedMessage> {
		const finalHeaders = await concludeHeaders(this._headers, this._ctx);

		const contentPart = await buildMessageAndAttachments(
			[...this._messages.values()],
			this._attachments,
			this._ctx,
		);
		if (typeof contentPart !== 'string') {
			finalHeaders.set(HEADER_LABELS.ContentType, contentPart.boundaryHeader);
		}

		const builtHeadersForSender = await buildHeaders([...finalHeaders.values()].sort(byHeaderOrder), this._ctx);

		const finalHeadersVisibleRecipients = new Map(finalHeaders);
		finalHeadersVisibleRecipients.delete(HEADER_LABELS.Bcc);
		const builtHeadersForToAndCc = await buildHeaders(
			[...finalHeadersVisibleRecipients.values()].sort(byHeaderOrder),
			this._ctx,
		);

		const builtHeadersForBcc: ComposedMessage['forBlindedRecipients'] = [];
		const bccHeader = finalHeaders.get(HEADER_LABELS.Bcc);
		if (bccHeader && isAddressHeader(bccHeader)) {
			for (const bccAddress of bccHeader.value) {
				const finalBccHeaders = new Map(finalHeaders);
				finalBccHeaders.set(HEADER_LABELS.Bcc, createHeader(HEADER_LABELS.Bcc, [bccAddress]));

				const builtHeaders = await buildHeaders([...finalBccHeaders.values()].sort(byHeaderOrder), this._ctx);
				builtHeadersForBcc.push([bccAddress, concatParts(builtHeaders, contentPart)]);
			}
		}

		return {
			forSender: concatParts(builtHeadersForSender, contentPart),
			forVisibleRecipients: concatParts(builtHeadersForToAndCc, contentPart),
			forBlindedRecipients: builtHeadersForBcc,
		};
	}
}

function concatParts(headers: string, contents: BuiltContentPart) {
	return headers + CRLF + (typeof contents === 'string' ? contents : CRLF + contents.content);
}

/**
 * Create new instance of {@ink MessageComposer}.
 *
 * @param customCtx inject your own context (dependencies) into the composer. Useful when one does not want to depend on the `@mailchain/encoding` package.
 */
export function createMessageComposer(customCtx?: MessageComposerContext): MessageComposer {
	return new MessageComposer(customCtx ?? defaultMessageComposerContext());
}