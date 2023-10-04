import { KindNaClSecretKey } from '@mailchain/crypto';
import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { EncodingTypes } from '@mailchain/encoding';
import { PayloadHeaders } from '../../transport/payload/headers';
import { ResolvedMailerHeaders } from '../../transport';
import { SerializablePayloadHeadersImpl } from './headersSerialize';

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
			} as PayloadHeaders,
			shouldThrow: false,
		},
		{
			name: 'mailer headers',
			input: {
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain-mailer',
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
			} as ResolvedMailerHeaders,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const serializedHeaders = new SerializablePayloadHeadersImpl().serialize(test.input);
			const deserializedHeaders = new SerializablePayloadHeadersImpl().deserialize(serializedHeaders);
			expect(deserializedHeaders).toEqual(test.input);
		});
	});
});
describe('SerializablePayloadHeadersImpl.serialize', () => {
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
			} as PayloadHeaders,
			expected: `Content-Encoding: base64/plain\r\nContent-Encryption: nacl-secret-key\r\nContent-Length: 5000\r\nContent-Signature: data=AAECAwQFBgcI; alg=ed25519\r\nContent-Type: message/x.mailchain\r\nCreated: 1970-01-01T00:00:01.000Z\r\nOrigin: data=cjyqI6W1Ea9a17fvYHbkFKt+danckQ6mDkF6K3cKVnE=; alg=ed25519`,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					new SerializablePayloadHeadersImpl().serialize(test.input);
				}).toThrow();
			} else {
				const actual = new SerializablePayloadHeadersImpl().serialize(test.input);
				expect(actual.toString()).toEqual(test.expected);
				expect(actual.toString().length).toEqual(test.expected.length);
			}
		});
	});
});

describe('SerializablePayloadHeadersImpl deserialize', () => {
	const tests = [
		{
			name: 'regular headers',
			input: `Content-Encoding: base64/plain\r\nContent-Encryption: nacl-secret-key\r\nContent-Length: 5000\r\nContent-Signature: data=AAECAwQFBgcI; alg=ed25519\r\nContent-Type: message/x.mailchain\r\nCreated: 1970-01-01T00:00:01.000Z\r\nOrigin: data=cjyqI6W1Ea9a17fvYHbkFKt+danckQ6mDkF6K3cKVnE=; alg=ed25519`,
			expected: {
				Origin: AliceED25519PublicKey,
				ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
				Created: new Date(1000),
				ContentLength: 5000,
				ContentType: 'message/x.mailchain',
				ContentEncoding: EncodingTypes.Base64,
				ContentEncryption: KindNaClSecretKey,
			} as PayloadHeaders,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					new SerializablePayloadHeadersImpl().deserialize(Buffer.from(test.input));
				}).toThrow();
			} else {
				expect(new SerializablePayloadHeadersImpl().deserialize(Buffer.from(test.input))).toEqual(
					test.expected,
				);
			}
		});
	});
});
