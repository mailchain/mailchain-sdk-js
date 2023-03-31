export function simpleMimeHeaderParser(message: string): Map<string, string> {
	const result = new Map<string, string>();
	const headersBlankLine = message.indexOf('\r\n\r\n');
	const headersPart = message.substring(0, headersBlankLine);
	const lines = headersPart.split('\r\n');

	let rawHeader = '';
	for (const line of lines) {
		if (/^\s/.test(line)) {
			// starts with white-space, continuing from previous line
			rawHeader += ' ' + line.trimStart();
		} else {
			if (rawHeader.length > 0) {
				const [key, value] = processRawHeader(rawHeader);
				result.set(key, value);
			}
			rawHeader = line;
		}
	}
	// Last line is not handled by the for loop
	if (rawHeader.length > 0) {
		const [key, value] = processRawHeader(rawHeader);
		result.set(key, value);
	}

	return result;
}

function processRawHeader(rawHeader: string): [string, string] {
	const colonIndex = rawHeader.indexOf(':');
	if (colonIndex > 0) {
		const key = rawHeader.substring(0, colonIndex).trim();
		const value = rawHeader.substring(colonIndex + 1, rawHeader.length).trim();
		return [key, value];
	}
	throw new Error(`invalid header formatting [${rawHeader}]`);
}
