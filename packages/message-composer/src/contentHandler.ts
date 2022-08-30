import { CRLF, LINE_LENGTH_FOLD } from './consts';
import { simpleHardFold } from './folding';
import { contentTypeBoundaryHeader } from './headerFactories';
import { buildHeaders, exportHeader } from './headerHandler';
import { ContentPart, StringHeader } from './types';
import { byHeaderOrder } from './headerOrder';
import { MessageComposerContext } from './messageComposerContext';

export type BuiltContentPart = string | { boundaryHeader: StringHeader; content: string };

export async function buildMessageAndAttachments(
	messageParts: ContentPart[],
	attachmentParts: ContentPart[],
	ctx: MessageComposerContext,
): Promise<BuiltContentPart> {
	const builtMessageParts = await buildContentParts(messageParts, false, ctx);

	// No attachments, exporting just as as string or 'multipart/alternative'
	if (attachmentParts.length === 0) {
		if (typeof builtMessageParts === 'string') return builtMessageParts;
		return {
			boundaryHeader: contentTypeBoundaryHeader('alternative', builtMessageParts.boundary),
			content: builtMessageParts.parts,
		};
	}

	const builtAttachmentParts = await buildContentParts(attachmentParts, true, ctx);

	const mixedBoundaryLine = `--${builtAttachmentParts.boundary}`;
	let content = mixedBoundaryLine + CRLF;
	if (typeof builtMessageParts === 'string') {
		content += builtMessageParts + CRLF;
	} else {
		const altHeader = contentTypeBoundaryHeader('alternative', builtMessageParts.boundary);
		content += (await exportHeader(altHeader, ctx)) + CRLF + CRLF;
		content += builtMessageParts.parts + CRLF;
	}
	content += builtAttachmentParts.parts;
	return { boundaryHeader: contentTypeBoundaryHeader('mixed', builtAttachmentParts.boundary), content };
}

export async function buildContentParts(
	parts: ContentPart[],
	forceMultipart: true,
	ctx: MessageComposerContext,
): Promise<{ boundary: string; parts: string }>;
export async function buildContentParts(
	parts: ContentPart[],
	forceMultipart: false,
	ctx: MessageComposerContext,
): Promise<string | { boundary: string; parts: string }>;
export async function buildContentParts(
	parts: ContentPart[],
	forceMultipart: boolean,
	ctx: MessageComposerContext,
): Promise<string | { boundary: string; parts: string }> {
	const builtParts = await Promise.all(parts.map((p) => buildContentPart(p, ctx)));
	if (builtParts.length === 1 && !forceMultipart) return builtParts[0];

	const boundary = (await ctx.encodeBase64(ctx.random(9))).toUpperCase();
	const boundaryLine = `--${boundary}`;

	const builtPartsStr = builtParts.reduce((acc, curr, i) => {
		acc += boundaryLine + CRLF; // Append boundaryLine before each part
		acc += curr + CRLF;
		if (i === builtParts.length - 1) {
			// Append boundaryLine only on the last part
			acc += boundaryLine;
		}
		return acc;
	}, '');
	return {
		boundary,
		parts: builtPartsStr,
	};
}

export async function buildContentPart(
	{ content, headers }: ContentPart,
	ctx: MessageComposerContext,
): Promise<string> {
	let result = await buildHeaders(headers.sort(byHeaderOrder), ctx);
	result += CRLF + CRLF; // leave out blank line

	const encodedContent = typeof content === 'string' ? content : await ctx.encodeBase64(Uint8Array.from(content));
	result += simpleHardFold(encodedContent, { lineLength: LINE_LENGTH_FOLD, encodingConsideration: 'base64' });

	return result;
}
