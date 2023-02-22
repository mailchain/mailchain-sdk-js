export const CHUNK_LENGTH_1MB = 1024 * 1024;

export function chunkBuffer(input: Uint8Array | Buffer, length: number): Buffer[] {
	let buffer = input instanceof Buffer ? input : Buffer.from(input);
	const result: Buffer[] = [];

	while (buffer.length > length) {
		const chunk = buffer.slice(0, length);
		buffer = buffer.slice(length);
		result.push(chunk);
	}

	if (buffer.length) {
		result.push(buffer);
	}

	return result;
}
