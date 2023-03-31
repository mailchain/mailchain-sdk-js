import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { createContentBuffer, MailerContent, parseMailerContentFromJSON } from './content';

describe('createContentBuffer', () => {
	it('example payload', () => {
		const actual = createContentBuffer({
			version: '1',
			contentUri: 'https://example.com',
			contentHash: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
			date: new Date('2020-06-06'),
			authorMailAddress: {
				name: 'Alice',
				address: 'alice@mailchain.com',
			},
			to: [
				{
					name: 'Bob',
					address: 'bob@mailchain.com',
				},
			],
			mailerProof: {
				params: {
					expires: new Date('2022-06-06'),
					mailerMessagingKey: BobED25519PublicKey,
					authorContentSignature: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
				},
				signature: new Uint8Array([0x0a, 0xb, 0xc, 0xd]),
				version: '1.0',
			},
			messageId: 'message-id-0',
			authorMessagingKey: AliceED25519PublicKey,
			authorContentSignature: new Uint8Array([0x09, 0x10, 0x11, 0x12]),
		} as MailerContent);

		expect(actual).toMatchSnapshot('original');
	});
});

describe('round trip', () => {
	it('example payload', () => {
		const original: MailerContent = {
			version: '1.0',
			contentUri: 'https://example.com',
			date: new Date('2023-01-18T18:10:38.896Z'),
			authorMailAddress: {
				name: '',
				address: 'alice@mailchain.com',
			},
			to: [
				{
					name: '',
					address: 'bob@mailchain.com',
				},
			],
			mailerProof: {
				params: {
					expires: new Date('2022-06-06'),
					mailerMessagingKey: BobED25519PublicKey,
					authorContentSignature: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
				},
				signature: new Uint8Array([0x0a, 0xb, 0xc, 0xd]),
				version: '1.0',
			},
			messageId: 'message-id-0',
			authorMessagingKey: AliceED25519PublicKey,
		};

		const bufferedContent = createContentBuffer(original);

		const actual = parseMailerContentFromJSON(bufferedContent);

		expect(actual).toEqual(original);
	});
});
