import { consolidateMailboxAliases } from './consolidateMailboxAliases';
import { AliceAccountMailbox, AliceWalletMailbox, BobAccountMailbox, BobWalletMailbox } from './test.const';

describe('consolidateMailboxAliases', () => {
	it('should not filter aliases with unique addresses', () => {
		const result = consolidateMailboxAliases([
			AliceAccountMailbox.aliases[0],
			AliceWalletMailbox.aliases[0],
			BobAccountMailbox.aliases[0],
			BobWalletMailbox.aliases[0],
		]);

		expect(result).toEqual([
			AliceAccountMailbox.aliases[0],
			AliceWalletMailbox.aliases[0],
			BobAccountMailbox.aliases[0],
			BobWalletMailbox.aliases[0],
		]);
	});

	it('should filter aliases with same address', () => {
		const result = consolidateMailboxAliases([
			AliceAccountMailbox.aliases[0],
			{ ...AliceAccountMailbox.aliases[0], allowSending: false },
			{ ...AliceAccountMailbox.aliases[0], allowReceiving: false },
			BobAccountMailbox.aliases[0],
		]);

		expect(result).toEqual([AliceAccountMailbox.aliases[0], BobAccountMailbox.aliases[0]]);
	});
});
