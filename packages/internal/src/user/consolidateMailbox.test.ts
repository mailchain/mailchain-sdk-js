import { createNameServiceAddress } from '@mailchain/addressing';
import { AliceFilStr } from '@mailchain/addressing/protocols/filecoin/const';
import { consolidateMailbox, consolidateMailboxAliases, consolidateMailboxLabel } from './consolidateMailbox';
import { createMailboxAlias } from './createAlias';
import { AliceAccountMailbox, AliceWalletMailbox, BobAccountMailbox, BobWalletMailbox } from './test.const';
import { Alias } from './types';

describe('consolidateMailbox', () => {
	it('should not change/consolidate anything when everything is OK', () => {
		expect(consolidateMailboxLabel(AliceAccountMailbox)).toEqual(AliceAccountMailbox);
		expect(consolidateMailboxLabel(AliceWalletMailbox)).toEqual(AliceWalletMailbox);
		expect(consolidateMailboxLabel(BobAccountMailbox)).toEqual(BobAccountMailbox);
		expect(consolidateMailboxLabel(BobWalletMailbox)).toEqual(BobWalletMailbox);
	});

	it('should consolidate mailbox', () => {
		const result = consolidateMailbox({
			...AliceWalletMailbox,
			aliases: [...AliceWalletMailbox.aliases, ...AliceWalletMailbox.aliases],
			label: '	' + AliceWalletMailbox.label + ' ',
		});

		expect(result).toEqual(AliceWalletMailbox);
	});

	describe('consolidateMailboxAliases', () => {
		it('should not filter aliases with unique addresses', () => {
			const mailbox = {
				...AliceAccountMailbox,
				aliases: [
					AliceAccountMailbox.aliases[0],
					AliceWalletMailbox.aliases[0],
					BobAccountMailbox.aliases[0],
					BobWalletMailbox.aliases[0],
				] as [Alias, ...Alias[]],
			};

			const result = consolidateMailboxAliases(mailbox);

			expect(result).toEqual(mailbox);
		});

		it('should filter aliases with same address', () => {
			const mailbox = {
				...AliceAccountMailbox,
				aliases: [
					AliceAccountMailbox.aliases[0],
					{ ...AliceAccountMailbox.aliases[0], allowSending: false },
					{ ...AliceAccountMailbox.aliases[0], allowReceiving: false },
					BobAccountMailbox.aliases[0],
				] as [Alias, ...Alias[]],
			};

			const result = consolidateMailboxAliases(mailbox);

			expect(result.aliases).toEqual([AliceAccountMailbox.aliases[0], BobAccountMailbox.aliases[0]]);
		});

		it('should filter Filecoin aliases', () => {
			const mailbox = {
				...AliceWalletMailbox,
				aliases: [
					AliceWalletMailbox.aliases[0],
					createMailboxAlias(createNameServiceAddress(AliceFilStr, 'filecoin.mailchain.test')),
				] as [Alias, ...Alias[]],
			};

			const result = consolidateMailboxAliases(mailbox);

			expect(result.aliases).toEqual([AliceWalletMailbox.aliases[0]]);
		});
	});

	describe('consolidateLabel', () => {
		it('should trim padding', () => {
			const result = consolidateMailboxLabel({
				...AliceWalletMailbox,
				label: '  ' + AliceWalletMailbox.label + '	',
			});

			expect(result).toEqual(AliceWalletMailbox);
		});

		it('should consolidate label to null when it is empty', () => {
			const result = consolidateMailboxLabel({ ...AliceWalletMailbox, label: '' });

			expect(result).toEqual({ ...AliceWalletMailbox, label: null });
		});

		it('should consolidate label to null when it is blank spaces', () => {
			const result = consolidateMailboxLabel({ ...AliceWalletMailbox, label: '  	 ' });

			expect(result).toEqual({ ...AliceWalletMailbox, label: null });
		});
	});
});
