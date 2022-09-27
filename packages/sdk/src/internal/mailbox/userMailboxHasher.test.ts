import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { encodeBase64 } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { AliceAccountMailbox, AliceWalletMailbox } from '../user/test.const';
import { createMailchainUserMailboxHasher } from './userMailboxHasher';

describe('userMailboxHasher', () => {
	const aliceKeyring = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	const bobKeyring = KeyRing.fromPrivateKey(BobED25519PrivateKey);

	it('should create different hash for different mailboxes', async () => {
		const hasher = createMailchainUserMailboxHasher(aliceKeyring);

		const accountMailboxHash = await hasher(AliceAccountMailbox);
		const walletMailboxHash = await hasher(AliceWalletMailbox);

		expect(accountMailboxHash).not.toEqual(walletMailboxHash);
		expect(encodeBase64(accountMailboxHash)).toEqual(
			'LwJK33UK8z6DNlMNRDVo13y8GIz+Q4aGLiPH7Pq117fHbv/LorIBlG/R8kQJjLHDd/tHUTSgSm0SmxrJ5dRzAw==',
		);
		expect(encodeBase64(walletMailboxHash)).toEqual(
			'6/Pw+qYgHOu/FgpBHKgp7xk6ge+W7e/b7okqAaypwAXc3z2kl4uV96vfZvFC+ixSp1h6x66ksBCquass11aWCg==',
		);
	});

	it('should create different hash for same mailbox but different keyring', async () => {
		const aliceHasher = createMailchainUserMailboxHasher(aliceKeyring);
		const bobHasher = createMailchainUserMailboxHasher(bobKeyring);

		const hashByAlice = await aliceHasher(AliceWalletMailbox);
		const hashByBob = await bobHasher(AliceWalletMailbox);

		expect(hashByAlice).not.toEqual(hashByBob);
		expect(encodeBase64(hashByAlice)).toEqual(
			'6/Pw+qYgHOu/FgpBHKgp7xk6ge+W7e/b7okqAaypwAXc3z2kl4uV96vfZvFC+ixSp1h6x66ksBCquass11aWCg==',
		);
		expect(encodeBase64(hashByBob)).toEqual(
			'CRa7BJam05U2qeX/253LgTEC7J3tGK60g3ypTnRYInrfkq6uKM0CiGGWGmS1MimWhLJQQBXmEtcbrHZU5+B0AQ==',
		);
	});
});
