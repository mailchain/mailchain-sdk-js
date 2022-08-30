export type Address = {
	name?: string;
	address: string;
};

export type Header<T> = {
	label: string;
	value: T;
	attrs?: [string | undefined, string][];
};

export type StringHeader = Header<string>;
export function isStringHeader(header: Header<any>): header is StringHeader {
	return typeof header.value === 'string';
}

export type DateHeader = Header<Date>;
export function isDateHeader(header: Header<any>): header is DateHeader {
	return header.value instanceof Date;
}

export type AddressHeader = Header<Address[]>;
export function isAddressHeader(header: Header<any>): header is AddressHeader {
	return Array.isArray(header.value) && header.value.every((a: any) => typeof a.address === 'string');
}

export type ContentPart = {
	headers: Header<any>[];
	content: string | Buffer;
};

export type Attachment = {
	/**
	 * Value for the Content-ID header.
	 *
	 * Unique identifier for the attachment that can be used to reference it to embed it into the content of the mail content.
	 */
	cid: string;
	/** The name of the attachment.  */
	filename: string;
	/** `Base64` encoded value of the bytes or just `Buffer` from it. */
	content: string | Buffer;
	/**
	 * The MIME content type of the attachment.
	 *
	 * Example: For a textual file `"file.txt"` the content type would be `"text/plain"`.
	 *
	 * More common types: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
	 */
	contentType: string;
};
