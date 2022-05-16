import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { PayloadHeaders, SerializablePayloadHeaders } from './headers';

describe('SerializablePayloadHeaders.FromEncryptedPayloadHeaders', () => {
	const tests = [
		{
			name: 'regular headers',
			input: {
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: 'base64/plain',
				ContentEncryption: 'nacl-secret-key',
			} as PayloadHeaders,
			expected: {
				headers: {
					Origin: AliceED25519PublicKey,
					ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
					Created: new Date(1000),
					ContentLength: 5000,
					ContentType: 'message/x.mailchain',
					ContentEncoding: 'base64/plain',
					ContentEncryption: 'nacl-secret-key',
				},
			},
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const target = SerializablePayloadHeaders;

			if (test.shouldThrow) {
				expect(() => {
					new target(test.input);
				}).toThrow();
			} else {
				expect(new target(test.input)).toEqual(test.expected);
			}
		});
	});
});

describe('SerializablePayloadHeaders.ToBuffer', () => {
	const tests = [
		{
			name: 'regular headers',
			input: SerializablePayloadHeaders.FromEncryptedPayloadHeaders({
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: 'base64/plain',
				ContentEncryption: 'nacl-secret-key',
			} as PayloadHeaders),
			expected: `Content-Encoding: base64/plain\r\nContent-Encryption: nacl-secret-key\r\nContent-Length: 5000\r\nContent-Signature: data=AAECAwQFBgcI; alg=ed25519\r\nContent-Type: message/x.mailchain\r\nCreated: 1970-01-01T00:00:01.000Z\r\nOrigin: data=cjyqI6W1Ea9a17fvYHbkFKt+danckQ6mDkF6K3cKVnE=; alg=ed25519`,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					test.input.ToBuffer();
				}).toThrow();
			} else {
				const actual = test.input.ToBuffer();
				expect(actual.toString()).toEqual(test.expected);
				expect(actual.toString().length).toEqual(test.expected.length);
			}
		});
	});
});

describe('SerializablePayloadHeaders.FromBuffer', () => {
	const tests = [
		{
			name: 'regular headers',
			input: `Content-Encoding: base64/plain\r\nContent-Encryption: nacl-secret-key\r\nContent-Length: 5000\r\nContent-Signature: data=AAECAwQFBgcI; alg=ed25519\r\nContent-Type: message/x.mailchain\r\nCreated: 1970-01-01T00:00:01.000Z\r\nOrigin: data=cjyqI6W1Ea9a17fvYHbkFKt+danckQ6mDkF6K3cKVnE=; alg=ed25519`,
			expected: SerializablePayloadHeaders.FromEncryptedPayloadHeaders({
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: 'base64/plain',
				ContentEncryption: 'nacl-secret-key',
			} as PayloadHeaders),
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					SerializablePayloadHeaders.FromBuffer(Buffer.from(test.input));
				}).toThrow();
			} else {
				expect(SerializablePayloadHeaders.FromBuffer(Buffer.from(test.input))).toEqual(test.expected);
			}
		});
	});
});
