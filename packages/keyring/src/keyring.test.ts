import { AliceED25519PrivateKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { ETHEREUM } from '@mailchain/internal/protocols';
import { KeyRing } from './keyring';

describe('keyring', () => {
	it('should assert against previous snapshot outputs from keyring', async () => {
		const kr = KeyRing.FromPrivateKey(AliceED25519PrivateKey);

		expect(kr.addressMessagingKey(new Uint8Array([1, 3, 3, 7]), ETHEREUM, 1)).toMatchSnapshot(
			'addressMessagingKey',
		);
		expect(kr.rootInboxKey()).toMatchSnapshot('rootInboxKey');
		expect(kr.rootEncryptionPublicKey()).toMatchSnapshot('rootEncryptionPublicKey');
		expect(kr.accountMessagingKey()).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountMessagingKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountIdentityKey()).toMatchSnapshot('accountIdentityKey');
		expect(await kr.accountIdentityKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountIdentityKey');
	});

	it('should encrypt and decrypt for user profile data', async () => {
		const kr = KeyRing.FromPrivateKey(AliceED25519PrivateKey);
		const userProfileCrypto = kr.userProfileCrypto();
		const input = new Uint8Array([1, 3, 3, 7]);

		const encrypted = await userProfileCrypto.encrypter(input);
		const decrypted = await userProfileCrypto.decrypter(encrypted);

		expect(decrypted).toEqual(input);
	});
});
