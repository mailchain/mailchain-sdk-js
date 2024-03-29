import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ETHEREUM, MAILCHAIN } from '@mailchain/addressing/protocols';
import { AliceSECP256K1PublicAddress } from '@mailchain/addressing/protocols/ethereum/test.const';
import { KeyRing } from './keyring';

describe('keyring', () => {
	it('should assert against previous snapshot outputs from alice keyring', async () => {
		const kr = KeyRing.fromPrivateKey(AliceED25519PrivateKey);

		expect(kr.inboxMessageDateOffset()).toEqual(204954984);
		expect(kr.addressBytesMessagingKey(AliceSECP256K1PublicAddress, ETHEREUM, 1)).toMatchSnapshot(
			'addressMessagingKey',
		);
		expect(kr.addressBytesMessagingKey(AliceSECP256K1PublicAddress, MAILCHAIN, 1).publicKey).toEqual(
			kr.accountMessagingKey().publicKey,
		);

		expect(kr.rootInboxKey()).toMatchSnapshot('rootInboxKey');
		expect(kr.rootEncryptionPublicKey()).toMatchSnapshot('rootEncryptionPublicKey');
		expect(kr.accountMessagingKey()).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountMessagingKey().sign(AliceSECP256K1PublicAddress)).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountIdentityKey()).toMatchSnapshot('accountIdentityKey');
		expect(await kr.accountIdentityKey().sign(AliceSECP256K1PublicAddress)).toMatchSnapshot('accountIdentityKey');
	});

	it('should assert against previous snapshot outputs from bob keyring', async () => {
		const kr = KeyRing.fromPrivateKey(BobED25519PrivateKey);

		expect(kr.inboxMessageDateOffset()).toEqual(635667296);
		expect(kr.addressBytesMessagingKey(new Uint8Array([1, 3, 3, 7]), ETHEREUM, 1)).toMatchSnapshot(
			'addressMessagingKey',
		);
		expect(kr.addressBytesMessagingKey(new Uint8Array([1, 3, 3, 7]), MAILCHAIN, 1).publicKey).toEqual(
			kr.accountMessagingKey().publicKey,
		);
		expect(kr.rootInboxKey()).toMatchSnapshot('rootInboxKey');
		expect(kr.rootEncryptionPublicKey()).toMatchSnapshot('rootEncryptionPublicKey');
		expect(kr.accountMessagingKey()).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountMessagingKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountMessagingKey');
		expect(kr.accountIdentityKey()).toMatchSnapshot('accountIdentityKey');
		expect(await kr.accountIdentityKey().sign(new Uint8Array([1, 3, 3, 7]))).toMatchSnapshot('accountIdentityKey');
	});

	it('should encrypt and decrypt for user mailbox data', async () => {
		const kr = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
		const userMailboxCrypto = kr.userMailboxCrypto();
		const input = new Uint8Array([1, 3, 3, 7]);

		const encrypted = await userMailboxCrypto.encrypt(input);
		const decrypted = await userMailboxCrypto.decrypt(encrypted);

		expect(decrypted).toEqual(input);
	});

	it('should encrypt and decrypt for user settings data', async () => {
		const kr = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
		const userSettingsCrypto = kr.userSettingsCrypto();
		const input = new Uint8Array([1, 3, 3, 7]);

		const encrypted = await userSettingsCrypto.encrypt(input);
		const decrypted = await userSettingsCrypto.decrypt(encrypted);

		expect(decrypted).toEqual(input);
	});
});
