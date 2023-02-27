import { HEADER_LABELS } from './consts';
import { createHeader, createMessageIdHeader } from './headerFactories';
import { MessageComposerContext } from './messageComposerContext';
import { Address, DateHeader, Header, MessageIdsHeader } from './types';

export async function concludeHeaders(
	headers: Map<string, Header<any>>,
	ctx: MessageComposerContext,
): Promise<Map<string, Header<any>>> {
	const finalHeaders = new Map(headers);

	const fromHeader = finalHeaders.get(HEADER_LABELS.From);
	if (fromHeader == null)
		throw new Error('defining FROM is required, more info https://www.rfc-editor.org/rfc/rfc5322#section-3.6');

	finalHeaders.set(HEADER_LABELS.MimeVersion, createHeader(HEADER_LABELS.MimeVersion, '1.0'));
	if (!finalHeaders.has(HEADER_LABELS.MessageId)) {
		finalHeaders.set(HEADER_LABELS.MessageId, await fallbackMessageId(fromHeader.value[0], ctx));
	}
	if (!finalHeaders.has(HEADER_LABELS.Date)) {
		finalHeaders.set(HEADER_LABELS.Date, await fallbackDate(ctx));
	}

	return finalHeaders;
}

export async function fallbackMessageId(from: Address, ctx: MessageComposerContext): Promise<MessageIdsHeader> {
	const senderDomain = from.address.split('@')[1];
	const idValue = await ctx.encodeBase64(ctx.random(32));
	return createMessageIdHeader(HEADER_LABELS.MessageId, [`${idValue}@${senderDomain}`]);
}

export async function fallbackDate(ctx: MessageComposerContext): Promise<DateHeader> {
	return createHeader(HEADER_LABELS.Date, new Date());
}
