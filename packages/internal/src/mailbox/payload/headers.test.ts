import { KindNaClSecretKey } from '@mailchain/crypto';
import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { EncodingTypes } from '@mailchain/encoding';
import { MailPayloadHeaders, SerializableMailPayloadHeaders } from './headers';

describe('RoundTripTest', () => {
	const tests = [
		{
			name: 'regular headers',
			input: {
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: EncodingTypes.Base64,
				ContentEncryption: KindNaClSecretKey,
			} as MailPayloadHeaders,
			shouldThrow: false,
		},
		{
			name: 'mailer headers',
			input: {
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: EncodingTypes.Base64,
				ContentEncryption: KindNaClSecretKey,
				MailerContent: {
					authorMailAddress: { address: 'author@mailchain.com', name: '' },
					authorMessagingKey: BobED25519PublicKey,
					contentUri: 'https://example.com/content',
					date: new Date('2020-01-01T00:00:01.000Z'),
					mailerProof: {
						params: {
							authorContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
							expires: new Date('2020-01-01T00:00:01.000Z'),
							mailerMessagingKey: BobED25519PublicKey,
						},
						signature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
						version: '1.0',
					},
					messageId: 'message-id',
					to: [{ address: 'recipient@mailchain.com', name: '' }],
					version: '1.0',
				},
			} as MailPayloadHeaders,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const original = SerializableMailPayloadHeaders.FromEncryptedMailPayloadHeaders(test.input);
			const bufferedHeaders = original.ToBuffer();
			const deserializedHeaders = SerializableMailPayloadHeaders.FromBuffer(bufferedHeaders);
			expect(original).toEqual(deserializedHeaders);
		});
	});
});

describe('SerializableMailPayloadHeaders.FromEncryptedMailPayloadHeaders', () => {
	const tests = [
		{
			name: 'regular headers',
			input: {
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: EncodingTypes.Base64,
				ContentEncryption: KindNaClSecretKey,
			} as MailPayloadHeaders,
			expected: {
				headers: {
					Origin: AliceED25519PublicKey,
					ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
					Created: new Date(1000),
					ContentLength: 5000,
					ContentType: 'message/x.mailchain',
					ContentEncoding: EncodingTypes.Base64,
					ContentEncryption: KindNaClSecretKey,
				},
			} as SerializableMailPayloadHeaders,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const target = SerializableMailPayloadHeaders;

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

describe('SerializableMailPayloadHeaders.ToBuffer', () => {
	const tests = [
		{
			name: 'regular headers',
			input: SerializableMailPayloadHeaders.FromEncryptedMailPayloadHeaders({
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: EncodingTypes.Base64,
				ContentEncryption: KindNaClSecretKey,
			} as MailPayloadHeaders),
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

describe('SerializableMailPayloadHeaders.FromBuffer', () => {
	const tests = [
		{
			name: 'regular headers',
			input: `Content-Encoding: base64/plain\r\nContent-Encryption: nacl-secret-key\r\nContent-Length: 5000\r\nContent-Signature: data=AAECAwQFBgcI; alg=ed25519\r\nContent-Type: message/x.mailchain\r\nCreated: 1970-01-01T00:00:01.000Z\r\nOrigin: data=cjyqI6W1Ea9a17fvYHbkFKt+danckQ6mDkF6K3cKVnE=; alg=ed25519`,
			expected: SerializableMailPayloadHeaders.FromEncryptedMailPayloadHeaders({
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: EncodingTypes.Base64,
				ContentEncryption: KindNaClSecretKey,
			} as MailPayloadHeaders),
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					SerializableMailPayloadHeaders.FromBuffer(Buffer.from(test.input));
				}).toThrow();
			} else {
				expect(SerializableMailPayloadHeaders.FromBuffer(Buffer.from(test.input))).toEqual(test.expected);
			}
		});
	});
});
