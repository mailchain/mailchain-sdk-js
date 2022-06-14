import { AliceED25519PrivateKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { ETHEREUM } from '@mailchain/internal/protocols';
import { KeyRing } from './keyring';

describe('keyring', () => {
	it('should assert against previous snapshot outputs from keyring', () => {
		const kr = KeyRing.FromPrivateKey(AliceED25519PrivateKey);

		expect(kr.createIdentityKeyForPublicKey(BobED25519PublicKey)).toMatchSnapshot();
		expect(kr.createMessagingKeyForAddress(Buffer.from('123'), ETHEREUM, 1)).toMatchSnapshot();
		expect(kr.rootInboxKey()).toMatchSnapshot();
		expect(kr.rootEncryptionPublicKey()).toMatchSnapshot();
		expect(kr.accountMessagingKey()).toMatchSnapshot();
		expect(kr.rootInboxKey()).toMatchSnapshot();
	});
});
