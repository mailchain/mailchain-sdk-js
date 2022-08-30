import formatDate from 'date-fns/format';
import enUS from 'date-fns/locale/en-US';
import { hasOnlyPrintableUsAscii } from './hasOnlyAscii';
import { semanticLineFold, simpleHardFold } from './folding';
import {
	AddressHeader,
	DateHeader,
	Header,
	isAddressHeader,
	isDateHeader,
	isStringHeader,
	StringHeader,
} from './types';
import { CRLF, LINE_LENGTH_FOLD } from './consts';
import { MessageComposerContext } from './messageComposerContext';

/**
 * Processes all the headers and outputs single `string` chunk that represents the headers into MIME format.
 *
 * Note: there isn't leading/trailing CRLF of the output, you need to add your own if you want one.
 */
export async function buildHeaders(headers: Header<any>[], ctx: MessageComposerContext): Promise<string> {
	const exportedHeaders = new Array<string>();
	for (const header of headers) {
		const exportedHeader = await exportHeader(header, ctx);
		exportedHeaders.push(exportedHeader);
	}
	return exportedHeaders.join(CRLF);
}

/**
 * Export single {@link Header} into it's MIME format. May contain multiple lines if the contents have been folded.
 *
 * Example: `"Subject: This is the subject of the message"`
 */
export async function exportHeader(header: Header<any>, ctx: MessageComposerContext): Promise<string> {
	const headerValue = await exportHeaderValue(header, ctx);
	if (header.attrs == null || header.attrs.length === 0) return `${header.label}: ${headerValue}`;

	const headerAttrs = await exportHeaderAttributes(header.attrs, ctx);

	// TODO: naive join of attrs, just appending at the end. Need to take care of length
	return [`${header.label}: ${headerValue}`, ...headerAttrs].join('; ');
}

/** Export just the {@link Header#value} part of the header. The {@link Header#label} is not exported. */
export async function exportHeaderValue(header: Header<any>, ctx: MessageComposerContext): Promise<string> {
	if (isStringHeader(header)) return exportStringHeader(header, ctx);
	if (isDateHeader(header)) return exportDateHeader(header, ctx);
	if (isAddressHeader(header)) return exportAddressHeader(header, ctx);

	throw new Error(`cannot export value for header [${header.label}]`);
}

/** Export the {@link Header#attrs} part of the header as separate element in the resulting `string[]` array. */
export async function exportHeaderAttributes(
	attrs: NonNullable<Header<any>['attrs']>,
	ctx: MessageComposerContext,
): Promise<string[]> {
	// TODO: Not taking line length limit into consideration
	return await Promise.all(
		attrs.map(async (attr) => {
			const value = hasOnlyPrintableUsAscii(attr[1])
				? attr[1]
				: `=?UTF-8?B?${await ctx.encodeBase64(await ctx.decodeUtf8(attr[1]))}?=`;

			if (attr[0] != null) return `${attr[0]}="${value}"`;
			return `"${value}"`;
		}),
	);
}

/** Export the `string` value out of {@link StringHeader}. It takes into consideration length of the value and the encoding of it. */
export async function exportStringHeader(header: StringHeader, ctx: MessageComposerContext): Promise<string> {
	if (hasOnlyPrintableUsAscii(header.value)) {
		return semanticLineFold(header.value, LINE_LENGTH_FOLD);
	}

	const utf8Array = await ctx.decodeUtf8(header.value);
	const base64Encoded = await ctx.encodeBase64(utf8Array);
	return simpleHardFold(base64Encoded, {
		lineLength: LINE_LENGTH_FOLD,
		prefix: '=?UTF-8?B?',
		suffix: '?=',
		padNewLines: true,
		encodingConsideration: 'base64',
	});
}

/**
 * Export the `Date` value out of {@link DateHeader}.
 *
 * Example: Wed, 17 Aug 2022 10:01:56 +0000
 */
export async function exportDateHeader(header: DateHeader, ctx: MessageComposerContext): Promise<string> {
	return formatDate(header.value, 'EEE, dd MMM yyyy HH:mm:ss xxxx', { locale: enUS });
}

/**
 * Export the addresses out of the {@link AddressHeader}.
 * It joins every address into new line divided with `",CRLF "`, ready to be appended to the header label.
 *
 * Example:
 * ```
 * "Alice Lastname" <alice@mailchain.com>,
 *  "Bob Lastname" <bob@mailchain.com>
 * ```
 */
export async function exportAddressHeader(header: AddressHeader, ctx: MessageComposerContext): Promise<string> {
	// TODO: Check for other ASCII characters that need to be escaped
	// TODO: Check for non ASCII characters (base64 encode)
	// TODO: check for length (going optimistically for now, splitting on each recipient)
	return header.value
		.map((r) => {
			return Boolean(r.name?.length) ? `"${r.name}" <${r.address}>` : `<${r.address}>`;
		})
		.join(`,${CRLF} `);
}
