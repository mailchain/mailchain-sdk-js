import { CRLF, HTAB } from './consts';

/**
 * Simple and efficient folding that doesn't take into consideration any white spaces nor other semantic breaks. It just folds at the `lengthLimit`.
 *
 * @param str the content to be folded
 * @param opts.lineLength the max length of the line
 * @param opts.prefix this will be added before each line (even when not folded). Counts toward line length limit.
 * @param opts.suffix this will be added after each line (even when not folded). Counts toward line length limit.
 * @param opts.padNewLines each new line (not the first line) will be have padding added at the beginning.
 * @param opts.encodingConsideration takes the encoding when folding. For `"base64"`, makes sure the folding happens on 4-char chunks.
 */
export function simpleHardFold(
	str: string,
	opts: {
		lineLength: number;
		prefix?: string;
		suffix?: string;
		padNewLines?: boolean;
		encodingConsideration: 'base64';
	},
): string {
	let finalContentLength = opts.lineLength - (opts.prefix?.length ?? 0) - (opts.suffix?.length ?? 0);
	finalContentLength =
		opts.encodingConsideration === 'base64' ? Math.floor(finalContentLength / 4) * 4 : finalContentLength;

	const numFoldedLines = Math.ceil(str.length / finalContentLength);
	let folded = '';
	for (let i = 0; i < numFoldedLines; i++) {
		if (opts.padNewLines && i > 0) folded += HTAB;
		const foldPart = str.substring(i * finalContentLength, (i + 1) * finalContentLength);
		folded += `${opts.prefix ?? ''}${foldPart}${opts.suffix ?? ''}`;
		if (i + 1 < numFoldedLines) {
			folded += CRLF; // don't put CRLF on last line
		}
	}
	return folded;
}

/**
 * Original source NodeMailer: https://github.com/nodemailer/nodemailer/blob/master/lib/mime-funcs/index.js#L501-L536
 *
 * Folds long lines, useful for folding header lines (afterSpace=false) and
 * flowed text (afterSpace=true)
 *
 * @param str String to be folded
 * @param lineLength length of a line
 * @param  afterSpace If true, leave a space in th end of a line
 *
 * @return String with folded lines
 */
export function semanticLineFold(str: string, lineLength: number, afterSpace?: boolean): string {
	let pos = 0,
		result = '',
		line: string,
		match: RegExpMatchArray | null;

	while (pos < str.length) {
		line = str.substring(pos, pos + lineLength);
		if (line.length < lineLength) {
			result += line;
			break;
		}
		if ((match = line.match(/^[^\n\r]*(\r?\n|\r)/))) {
			line = match[0];
			result += line;
			pos += line.length;
			continue;
		} else if (
			(match = line.match(/(\s+)[^\s]*$/)) &&
			match[0].length - (afterSpace ? (match[1] || '').length : 0) < line.length
		) {
			line = line.substring(0, line.length - (match[0].length - (afterSpace ? (match[1] || '').length : 0)));
		} else if ((match = str.substring(pos + line.length).match(/^[^\s]+(\s*)/))) {
			line = line + match[0].substring(0, match[0].length - (!afterSpace ? (match[1] || '').length : 0));
		}

		result += line;
		pos += line.length;
		if (pos < str.length) {
			result += CRLF;
		}
	}

	return result;
}

/**
 * Append the `appendParts` onto the `content` by checking if there is space left on the last line to append the part. If there is no space left, new line is started with HTAB padding.
 *
 * The content and each of the parts is delimited with semicolon `;`.
 */
export function contentAppendWithFolding(content: string, appendParts: string[], lineLength: number): string {
	const contentLines = content.split(CRLF);

	for (const part of appendParts) {
		const lastLine = contentLines[contentLines.length - 1];
		if (lastLine.length === 0 || lastLine.length + part.length < lineLength) {
			const resultLine = lastLine + (lastLine.length > 0 ? '; ' : '') + part; // add the ; delimiter only if the line was already some content
			contentLines[contentLines.length - 1] = resultLine;
		} else {
			contentLines[contentLines.length - 1] = lastLine + ';';
			contentLines.push(HTAB + part);
		}
	}
	return contentLines.join(CRLF);
}
