import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ETHEREUM, MAILCHAIN } from '@mailchain/internal/protocols';
import { KeyRing } from './keyring';

describe('keyring', () => {
	it('should assert against previous snapshot outputs from alice keyring', async () => {
		const kr = KeyRing.fromPrivateKey(AliceED25519PrivateKey);

		expect(kr.inboxMessageDateOffset()).toEqual(204954984);
		expect(kr.addressMessagingKey(new Uint8Array([1, 3, 3, 7]), ETHEREUM, 1)).toMatchSnapshot(
			'addressMessagingKey',
		);
		expect(kr.addressMessagingKey(new Uint8Array([1, 3, 3, 7]), MAILCHAIN, 1).publicKey).toEqual(
			kr.accountMessagingKey().publicKey,
		);
		expect(kr.rootInboxKey()).toMatchSnapshot('rootInboxKey');
		expect(kr.rootEncryptionPublicKey()).toMatchSnapshot('rootEncryptionPublicKey');
		expect(kr.accountMessagingKey()).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountMessagingKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountIdentityKey()).toMatchSnapshot('accountIdentityKey');
		expect(await kr.accountIdentityKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountIdentityKey');
	});

	it('should assert against previous snapshot outputs from bob keyring', async () => {
		const kr = KeyRing.fromPrivateKey(BobED25519PrivateKey);

		expect(kr.inboxMessageDateOffset()).toEqual(635667296);
		expect(kr.addressMessagingKey(new Uint8Array([1, 3, 3, 7]), ETHEREUM, 1)).toMatchSnapshot(
			'addressMessagingKey',
		);
		expect(kr.addressMessagingKey(new Uint8Array([1, 3, 3, 7]), MAILCHAIN, 1).publicKey).toEqual(
			kr.accountMessagingKey().publicKey,
		);
		expect(kr.rootInboxKey()).toMatchSnapshot('rootInboxKey');
		expect(kr.rootEncryptionPublicKey()).toMatchSnapshot('rootEncryptionPublicKey');
		expect(kr.accountMessagingKey()).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountMessagingKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountIdentityKey()).toMatchSnapshot('accountIdentityKey');
		expect(await kr.accountIdentityKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountIdentityKey');
	});

	it('should encrypt and decrypt for user profile data', async () => {
		const kr = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
		const userProfileCrypto = kr.userProfileCrypto();
		const input = new Uint8Array([1, 3, 3, 7]);

		const encrypted = await userProfileCrypto.encrypt(input);
		const decrypted = await userProfileCrypto.decrypt(encrypted);

		expect(decrypted).toEqual(input);
	});
});
