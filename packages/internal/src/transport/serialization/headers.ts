import { kindFromPublicKey, publicKeyFromKind, PublicKey } from '@mailchain/crypto';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { PayloadHeaders } from '../payload/headers';

export interface PayloadHeadersSerializer {
	serialize(headers: PayloadHeaders): Buffer;
	deserialize(serializedHeaders: Buffer): PayloadHeaders;
}

export function parseHeaderElements(input: string, requiredKeys: string[]): Map<string, string> {
	const invalidAttributes: string[] = [];
	const attributes = new Map<string, string>();
	input.split(';').forEach((item) => {
		const parts = item.split('=', 2);
		if (parts.length !== 2) {
			invalidAttributes.push(item);
		}
		attributes.set(parts[0].trim(), parts[1].trim());
	});

	requiredKeys.forEach((item) => {
		if (!attributes.get(item)) {
			throw new Error(`missing header attribute '${item}'`);
		}
	});

	return attributes;
}

export function parseSignatureHeader(input: string): Uint8Array {
	const attributes = parseHeaderElements(input, ['data']);

	const sig = decodeBase64(attributes.get('data')!.toString());

	if (sig.length === 0) {
		throw new Error('could not decode signature');
	}

	return sig;
}

export function createSignatureHeader(signature: Uint8Array, signer: PublicKey): string {
	const values: string[] = [];
	values.push(`data=${encodeBase64(signature)}`);
	values.push(`alg=${kindFromPublicKey(signer)}`);

	return values.join('; ').trimEnd();
}

export function parseOriginHeader(input: string): PublicKey {
	const attributes = parseHeaderElements(input, ['data', 'alg']);
	const bytes = decodeBase64(attributes.get('data')!.toString());

	return publicKeyFromKind(attributes.get('alg')!.toString(), bytes);
}

export function createOriginHeader(signer: PublicKey): string {
	const values: string[] = [];
	values.push(`data=${encodeBase64(signer.bytes)}`);
	values.push(`alg=${kindFromPublicKey(signer)}`);

	return values.join('; ').trimEnd();
}

export function headersMapFromBuffers(buffer: Buffer, requiredHeaders: string[]) {
	const { headers, invalidHeaders } = buffer
		.toString('utf8')
		.split('\r\n')
		.reduce(
			(result: { headers: Map<string, string>; invalidHeaders: string[] }, line: string) => {
				if (line.indexOf(':') === -1) {
					// splitting on ":" causes problem with dates
					result.invalidHeaders.push(line);
				}
				result.headers.set(line.slice(0, line.indexOf(':')).trim(), line.slice(line.indexOf(':') + 1).trim());

				return result;
			},
			{ headers: new Map<string, string>(), invalidHeaders: [] },
		);

	const missingHeaders = requiredHeaders.filter((x) => !headers.has(x));

	if (missingHeaders.length > 0) {
		throw new Error(`missing header(s) ${missingHeaders}`);
	}

	return { headers, invalidHeaders };
}
