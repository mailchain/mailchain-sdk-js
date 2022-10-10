import { encodeBase64 } from '@mailchain/encoding';
import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import { AliceAccountMailbox, AliceWalletMailbox } from '../user/test.const';
import { createMailchainUserMailboxHasher } from './userMailboxHasher';

describe('userMailboxHasher', () => {
	it('should create different hash for different mailboxes', async () => {
		const hasher = createMailchainUserMailboxHasher(aliceKeyRing);

		const accountMailboxHash = await hasher(AliceAccountMailbox);
		const walletMailboxHash = await hasher(AliceWalletMailbox);

		expect(accountMailboxHash).not.toEqual(walletMailboxHash);
		expect(encodeBase64(accountMailboxHash)).toEqual('tMqSrUrtyZFQvNMNiC0N+5lA2YO251BGO8rOn14SZcU=');
		expect(encodeBase64(walletMailboxHash)).toEqual('V4fWUJ9BMklgfZ5/eIho0ByCp4KoxS+2965MYN2JASY=');
	});

	it('should create different hash for same mailbox but different keyring', async () => {
		const aliceHasher = createMailchainUserMailboxHasher(aliceKeyRing);
		const bobHasher = createMailchainUserMailboxHasher(bobKeyRing);

		const hashByAlice = await aliceHasher(AliceWalletMailbox);
		const hashByBob = await bobHasher(AliceWalletMailbox);

		expect(hashByAlice).not.toEqual(hashByBob);
		expect(encodeBase64(hashByAlice)).toEqual('V4fWUJ9BMklgfZ5/eIho0ByCp4KoxS+2965MYN2JASY=');
		expect(encodeBase64(hashByBob)).toEqual('Hf0Yilygl9dqW93Ls9VlxiuQJoKwRDzIL0PYMFWK4wM=');
	});
});
