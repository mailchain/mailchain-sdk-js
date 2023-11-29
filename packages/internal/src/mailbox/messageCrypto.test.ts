import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import { KindNaClSecretKey, secureRandom } from '@mailchain/crypto';
import { BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { EncodingTypes } from '@mailchain/encoding';
import { Payload } from '../transport';
import { createMailchainMessageCrypto } from './messageCrypto';

const testPayload: Payload = {
	Content: Buffer.from(secureRandom(20 * 1024)), // 20KB,
	Headers: {
		Origin: BobED25519PublicKey,
		ContentSignature: secureRandom(),
		Created: new Date('11.27.2023'),
		ContentLength: 10 * 1024,
		ContentType: 'message/x.mailchain',
		ContentEncoding: EncodingTypes.Base64,
		ContentEncryption: KindNaClSecretKey,
	},
};

describe('createMailchainMessageCrypto', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should roundtrip', async () => {
		const messageCrypto = createMailchainMessageCrypto(aliceKeyRing);

		const encryptedPayload = await messageCrypto.encrypt(testPayload);
		const decryptedPayload = await messageCrypto.decrypt(encryptedPayload);

		expect(decryptedPayload).toEqual(testPayload);
	});

	it('should fail roundtrip with different keys', async () => {
		const messageCrypto = createMailchainMessageCrypto(aliceKeyRing);

		const encryptedPayload = await messageCrypto.encrypt(testPayload);

		const messageCrypto2 = createMailchainMessageCrypto(bobKeyRing);
		await expect(messageCrypto2.decrypt(encryptedPayload)).rejects.toThrowError();
	});
});
