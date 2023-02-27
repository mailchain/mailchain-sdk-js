import { CRLF, HEADER_LABELS } from './consts';
import { buildMessageAndAttachments, BuiltContentPart } from './contentHandler';
import { concludeHeaders } from './fallback';
import { hasOnlyPrintableUsAscii } from './hasOnlyAscii';
import { createHeader, createMessageIdHeader } from './headerFactories';
import { buildHeaders } from './headerHandler';
import { byHeaderOrder } from './headerOrder';
import { defaultMessageComposerContext, MessageComposerContext } from './messageComposerContext';
import { Address, Attachment, ContentPart, Header, HeaderAttribute, isAddressHeader } from './types';

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

export class MessageComposer {
	private readonly _headers: Map<string, Header<any>> = new Map();
	private readonly _overrideHeaders: Map<string, Map<string, Header<any>>> = new Map();
	private readonly _messages: Map<string, ContentPart> = new Map();
	private readonly _attachments: ContentPart[] = [];

	constructor(private readonly _ctx: MessageComposerContext) {}

	/** Set the `Message-ID` field for the message. If not set, random one would be generated. */
	id(value: string): MessageComposer {
		this._headers.set(HEADER_LABELS.MessageId, createMessageIdHeader(HEADER_LABELS.MessageId, [value]));
		return this;
	}

	/** Set the `Subject` filed for the message. If it consists of non US-ASCII characters, it will get encoded. */
	subject(value: string): MessageComposer {
		this._headers.set(HEADER_LABELS.Subject, createHeader(HEADER_LABELS.Subject, value));
		return this;
	}

	/** Set the `From` filed for the message. This is required field and must be set. */
	from(from: Address): MessageComposer {
		this._headers.set(HEADER_LABELS.From, createHeader(HEADER_LABELS.From, [from]));
		return this;
	}

	/**
	 * Set the recipients for the message based on the `type` parameter.
	 *
	 * Note: will override any pre-existing recipients for the given `type` when reinvoked with the same `type`.
	 */
	recipients(type: (typeof HEADER_LABELS)['To' | 'Cc' | 'Bcc'], ...recipients: Address[]): MessageComposer {
		this._headers.set(type, createHeader(type, [...recipients]));
		return this;
	}

	/**
	 * Set the address that the reply message should be sent to when you want the reply to go to an address that is different than the `From:` address.
	 */
	replyTo(address: Address): MessageComposer {
		this._headers.set(HEADER_LABELS.ReplyTo, createHeader(HEADER_LABELS.ReplyTo, [address]));
		return this;
	}

	/** Set the Date field for the message. If not set, timestamp of the time invoking `build` will set. */
	date(value: Date): MessageComposer {
		this._headers.set(HEADER_LABELS.Date, createHeader(HEADER_LABELS.Date, value));
		return this;
	}

	/**
	 * Set your own header with its own value.
	 *
	 * @param label the label for the header, can be any string containing just US-ASCII printable characters (without white space characters).
	 * @param value the value for the header, can be any `string` or {@link Date} or {@link Address} array. Providing other type values will fail.
	 * @param attrs custom set of attributes that will be applied to the header.
	 */
	customHeader<T extends string | Date | Address[]>(
		label: string,
		value: T,
		...attrs: HeaderAttribute[]
	): MessageComposer {
		return this.internalCustomHeader(this._headers, label, value, ...attrs);
	}

	/**
	 * Set (override any existing) custom header that will be applied to the message of the referenced `address`. The bcc recipient is provided via {@link MessageComposer.recipients}.
	 *
	 * This method is useful if there are custom header private value that only the Bcc recipient should be able to access.
	 *
	 * @param address the {@link Address.address} of the `Bcc` recipient
	 * @param label see `label` docs in {@link MessageComposer.customHeader}.
	 * @param value see `value` docs in {@link MessageComposer.customHeader}.
	 * @param attrs see `attrs` docs in {@link MessageComposer.customHeader}.
	 */
	overrideBccHeader<T extends string | Date | Address[]>(
		address: string,
		label: string,
		value: T,
		...attrs: HeaderAttribute[]
	): MessageComposer {
		if (!this._overrideHeaders.has(address)) {
			this._overrideHeaders.set(address, new Map());
		}

		return this.internalCustomHeader(this._overrideHeaders.get(address)!, label, value, ...attrs);
	}

	/**
	 * Set (override any existing) custom header that will be applied to the message of the sender {@link ComposedMessage.forSender}.
	 *
	 * This method is useful if there is some header value only meant for the sender of the message.
	 *
	 * @param label see `label` docs in {@link MessageComposer.customHeader}.
	 * @param value see `value` docs in {@link MessageComposer.customHeader}.
	 * @param attrs see `attrs` docs in {@link MessageComposer.customHeader}.
	 */
	overrideSenderHeader<T extends string | Date | Address[]>(
		label: string,
		value: T,
		...attrs: HeaderAttribute[]
	): MessageComposer {
		if (!this._overrideHeaders.has(HEADER_LABELS.From)) {
			this._overrideHeaders.set(HEADER_LABELS.From, new Map());
		}

		return this.internalCustomHeader(this._overrideHeaders.get(HEADER_LABELS.From)!, label, value, ...attrs);
	}

	private internalCustomHeader<T extends string | Date | Address[]>(
		headerStore: Map<string, Header<any>>,
		label: string,
		value: T,
		...attrs: HeaderAttribute[]
	): MessageComposer {
		if (!hasOnlyPrintableUsAscii(label, false)) {
			throw new Error(
				`invalid header label [${label}]. Header label should be composed only of printable US-ASCII characters without WSC.`,
			);
		}
		headerStore.set(`custom-${label}`, createHeader(label, value, ...attrs));
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
				createHeader(HEADER_LABELS.ContentType, `text/${type}`, ['charset', 'UTF-8']),
				createHeader(HEADER_LABELS.ContentTransferEncoding, `base64`),
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
				createHeader(HEADER_LABELS.ContentDisposition, 'attachment', ['filename', attachment.filename]),
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

		const finalHeadersForSender = new Map(finalHeaders);
		if (this._overrideHeaders.has(HEADER_LABELS.From)) {
			const overrideHeaders = this._overrideHeaders.get(HEADER_LABELS.From)!;
			overrideHeaders.forEach((value, key) => finalHeadersForSender.set(key, value));
		}
		const builtHeadersForSender = await buildHeaders(
			[...finalHeadersForSender.values()].sort(byHeaderOrder),
			this._ctx,
		);

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
				if (this._overrideHeaders.has(bccAddress.address)) {
					const overrideHeaders = this._overrideHeaders.get(bccAddress.address)!;
					overrideHeaders.forEach((value, key) => finalBccHeaders.set(key, value));
				}
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
