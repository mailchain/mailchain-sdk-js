import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import { ErrorPayloadSignatureInvalid, PayloadOriginVerifier } from './verifier';

describe('verifyPayloadOrigin', () => {
	it('verified', async () => {
		const verifier = new PayloadOriginVerifier();
		const content = Buffer.from([12, 123, 4, 3, 14, 67]);

		verifier.verifyPayloadOrigin({
			Content: content,
			Headers: {
				ContentEncoding: 'base64/plain',
				ContentEncryption: 'nacl-secret-key',
				ContentLength: 395,
				ContentSignature: await aliceKeyRing.accountMessagingKey().sign(content),
				ContentType: 'message/x.mailchain',
				Created: new Date('2022-07-13T18:44:48.536Z'),
				Origin: aliceKeyRing.accountMessagingKey().publicKey,
			},
		});
	});

	it('invalid signature', async () => {
		const verifier = new PayloadOriginVerifier();
		const content = Buffer.from([12, 123, 4, 3, 14, 67]);

		expect.assertions(1);
		await verifier
			.verifyPayloadOrigin({
				Content: content,
				Headers: {
					ContentEncoding: 'base64/plain',
					ContentEncryption: 'nacl-secret-key',
					ContentLength: 395,
					ContentSignature: await aliceKeyRing.accountMessagingKey().sign(content),
					ContentType: 'message/x.mailchain',
					Created: new Date('2022-07-13T18:44:48.536Z'),
					Origin: bobKeyRing.accountMessagingKey().publicKey, // incorrect key
				},
			})
			.catch((e) => expect(e).toEqual(new ErrorPayloadSignatureInvalid()));
	});
});
