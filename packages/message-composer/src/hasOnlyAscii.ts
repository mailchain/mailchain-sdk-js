const SP_CHAR_CODE = 32;
const HTAB_CHAR_CODE = 9;

export function hasOnlyPrintableUsAscii(str: string, allowWSC = true): boolean {
	// A field body may be composed of printable US-ASCII characters as well as the space (SP, ASCII value 32) and horizontal tab (HTAB, ASCII value 9)
	// https://www.rfc-editor.org/rfc/rfc5322#section-2.2
	for (let i = 0; i < str.length; i++) {
		const charCode = str.charCodeAt(i);
		if (
			(charCode >= 33 && charCode <= 126) ||
			(allowWSC && (charCode === SP_CHAR_CODE || charCode === HTAB_CHAR_CODE))
		) {
			continue;
		}
		return false;
	}
	return true;
}
