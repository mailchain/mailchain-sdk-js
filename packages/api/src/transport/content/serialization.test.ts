import { Deserialize, deserializeMessage, MessageKind, Serialize, serializeMessage } from './serialization';

describe('serializeMessage', () => {
	const tests = [
		{
			name: 'encrypted header',
			encryptedMessage: Buffer.from('encrypted-header', 'ascii'),
			expected: Buffer.concat([Buffer.from([1, 0, 0, 0, 16]), Buffer.from('encrypted-header', 'ascii')]),
			messageKind: MessageKind.HEADER,
			shouldThrow: false,
		},
		{
			name: 'encrypted chunk',
			encryptedMessage: Buffer.from('encrypted-chunk', 'ascii'),
			expected: Buffer.concat([Buffer.from([2, 0, 0, 0, 15]), Buffer.from('encrypted-chunk', 'ascii')]),
			messageKind: MessageKind.CHUNK,
			shouldThrow: false,
		},
		{
			name: 'encrypted final chunk',
			encryptedMessage: Buffer.from('encrypted-final-chunk', 'ascii'),
			expected: Buffer.concat([Buffer.from([3, 0, 0, 0, 21]), Buffer.from('encrypted-final-chunk', 'ascii')]),
			messageKind: MessageKind.FINAL_CHUNK,
			shouldThrow: false,
		},
		{
			name: 'encrypted unknown',
			encryptedMessage: Buffer.from('encrypted-final-chunk', 'ascii'),
			expected: Buffer.concat([Buffer.from([3, 0, 0, 0, 21]), Buffer.from('encrypted-final-chunk', 'ascii')]),
			messageKind: MessageKind.UNSET,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = serializeMessage;

		if (test.shouldThrow) {
			expect(() => {
				target(test.encryptedMessage, test.messageKind);
			}).toThrow();
		} else {
			expect(target(test.encryptedMessage, test.messageKind)).toEqual(test.expected);
		}
	});
});

describe('deserializeMessage', () => {
	const tests = [
		{
			name: 'encrypted header',
			encryptedMessage: Buffer.concat([Buffer.from([1, 0, 0, 0, 16]), Buffer.from('encrypted-header', 'ascii')]),
			expected: {
				kind: MessageKind.HEADER,
				message: Buffer.from('encrypted-header', 'ascii'),
				remainingBuffer: Buffer.alloc(0),
			},
			shouldThrow: false,
		},
		{
			name: 'encrypted chunk',
			encryptedMessage: Buffer.concat([Buffer.from([2, 0, 0, 0, 15]), Buffer.from('encrypted-chunk', 'ascii')]),
			expected: {
				kind: MessageKind.CHUNK,
				message: Buffer.from('encrypted-chunk', 'ascii'),
				remainingBuffer: Buffer.alloc(0),
			},
			shouldThrow: false,
		},
		{
			name: 'encrypted final chunk',
			encryptedMessage: Buffer.concat([
				Buffer.from([3, 0, 0, 0, 21]),
				Buffer.from('encrypted-final-chunk', 'ascii'),
			]),
			expected: {
				kind: MessageKind.FINAL_CHUNK,
				message: Buffer.from('encrypted-final-chunk', 'ascii'),
				remainingBuffer: Buffer.alloc(0),
			},
			shouldThrow: false,
		},
		{
			name: 'unset message',
			encryptedMessage: Buffer.concat([
				Buffer.from([0, 0, 0, 0, 21]),
				Buffer.from('encrypted-final-chunk', 'ascii'),
			]),
			shouldThrow: true,
		},
		{
			name: 'invalid message',
			encryptedMessage: Buffer.concat([
				Buffer.from([255, 0, 0, 0, 21]),
				Buffer.from('encrypted-final-chunk', 'ascii'),
			]),
			shouldThrow: true,
		},
		{
			name: 'too short to open',
			encryptedMessage: Buffer.from([1, 0, 16]),
			shouldThrow: true,
		},
		{
			name: 'incomplete message',
			encryptedMessage: Buffer.concat([Buffer.from([1, 0, 0, 0, 16]), Buffer.from('encrypted-he', 'ascii')]),
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = deserializeMessage;

		if (test.shouldThrow) {
			expect(() => {
				target(test.encryptedMessage);
			}).toThrow();
		} else {
			expect(target(test.encryptedMessage)).toEqual(test.expected);
		}
	});
});

describe('Serialize', () => {
	const tests = [
		{
			name: 'single chunk',
			encryptedHeader: Buffer.from('encrypted-header', 'ascii'),
			encryptedChunks: new Array<Buffer>(Buffer.from('encrypted-chunk-1', 'ascii')),
			expected: Buffer.concat([
				Buffer.from([1]),
				Buffer.from([1, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
				Buffer.from([3, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-1', 'ascii'),
			]),
			shouldThrow: false,
		},
		{
			name: 'multiple chunks',
			encryptedHeader: Buffer.from('encrypted-header', 'ascii'),
			encryptedChunks: new Array<Buffer>(
				Buffer.from('encrypted-chunk-1', 'ascii'),
				Buffer.from('encrypted-chunk-2', 'ascii'),
				Buffer.from('encrypted-chunk-3', 'ascii'),
			),
			expected: Buffer.concat([
				Buffer.from([1]),
				Buffer.from([1, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-1', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-2', 'ascii'),
				Buffer.from([3, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-3', 'ascii'),
			]),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = Serialize;

		if (test.shouldThrow) {
			expect(() => {
				target({ EncryptedHeaders: test.encryptedHeader, EncryptedContentChunks: test.encryptedChunks });
			}).toThrow();
		} else {
			expect(
				target({ EncryptedHeaders: test.encryptedHeader, EncryptedContentChunks: test.encryptedChunks }),
			).toEqual(test.expected);
		}
	});
});

describe('Deserialize', () => {
	const tests = [
		{
			name: 'single chunk',
			input: Buffer.concat([
				Buffer.from([1]),
				Buffer.from([1, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
				Buffer.from([3, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-1', 'ascii'),
			]),
			expected: {
				EncryptedHeaders: Buffer.from('encrypted-header', 'ascii'),
				EncryptedContentChunks: new Array<Buffer>(Buffer.from('encrypted-chunk-1', 'ascii')),
			},
			shouldThrow: false,
		},
		{
			name: 'multiple chunks',
			input: Buffer.concat([
				Buffer.from([1]),
				Buffer.from([1, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-1', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-2', 'ascii'),
				Buffer.from([3, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-3', 'ascii'),
			]),
			expected: {
				EncryptedHeaders: Buffer.from('encrypted-header', 'ascii'),
				EncryptedContentChunks: new Array<Buffer>(
					Buffer.from('encrypted-chunk-1', 'ascii'),
					Buffer.from('encrypted-chunk-2', 'ascii'),
					Buffer.from('encrypted-chunk-3', 'ascii'),
				),
			},
			shouldThrow: false,
		},
		{
			name: 'missing final chunk',
			input: Buffer.concat([
				Buffer.from([1]),
				Buffer.from([1, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-1', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-2', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-3', 'ascii'),
			]),
			shouldThrow: true,
		},
		{
			name: 'expected content chunk',
			input: Buffer.concat([
				Buffer.from([1]),
				Buffer.from([1, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
				Buffer.from([2, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
			]),
			shouldThrow: true,
		},
		{
			name: 'extra bytes than expected',
			input: Buffer.concat([
				Buffer.from([1]),
				Buffer.from([1, 0, 0, 0, 16]),
				Buffer.from('encrypted-header', 'ascii'),
				Buffer.from([2, 0, 0, 0, 17]),
				Buffer.from('encrypted-chunk-1', 'ascii'),
				Buffer.from('extra-data', 'ascii'),
			]),
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = Deserialize;

		if (test.shouldThrow) {
			expect(() => {
				target(test.input);
			}).toThrow();
		} else {
			expect(target(test.input)).toEqual(test.expected);
		}
	});
});
