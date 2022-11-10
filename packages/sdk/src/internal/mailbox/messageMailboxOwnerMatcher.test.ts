import { formatAddress, MAILCHAIN, parseNameServiceAddress } from '@mailchain/addressing';
import { ED25519PublicKey, secureRandom } from '@mailchain/crypto';
import { dummyMailData } from '../test.const';
import { AliceAccountMailbox, AliceWalletMailbox } from '../user/test.const';
import { AddressIdentityKeyResolver } from './addressIdentityKeyResolver';
import { MessageMailboxOwnerMatcher } from './messageMailboxOwnerMatcher';

const mockMessageHeaderResolver = jest.fn<
	ReturnType<AddressIdentityKeyResolver>,
	Parameters<AddressIdentityKeyResolver>
>();
jest.mock('./addressIdentityKeyResolver', () => ({
	createMessageHeaderIdentityKeyResolver: () => mockMessageHeaderResolver,
}));

describe('MessageMailboxOwnerMatcher', () => {
	let ownerMatcher: MessageMailboxOwnerMatcher;

	let apiResolver1: jest.Mock<ReturnType<AddressIdentityKeyResolver>, Parameters<AddressIdentityKeyResolver>>;
	let apiResolver2: jest.Mock<ReturnType<AddressIdentityKeyResolver>, Parameters<AddressIdentityKeyResolver>>;

	beforeEach(() => {
		apiResolver1 = jest.fn(async (address) => {
			if (formatAddress(address, 'mail') === dummyMailData.recipients[0].address)
				return { identityKey: AliceAccountMailbox.identityKey, protocol: MAILCHAIN };
			if (formatAddress(address, 'mail') === dummyMailData.carbonCopyRecipients[0].address)
				return { identityKey: AliceAccountMailbox.identityKey, protocol: MAILCHAIN };
			return { identityKey: new ED25519PublicKey(secureRandom(32)), protocol: MAILCHAIN };
		});
		apiResolver2 = jest.fn(async (address) => {
			if (formatAddress(address, 'mail') === dummyMailData.blindCarbonCopyRecipients[0].address)
				return { identityKey: AliceAccountMailbox.identityKey, protocol: MAILCHAIN };
			return { identityKey: new ED25519PublicKey(secureRandom(32)), protocol: MAILCHAIN };
		});
		ownerMatcher = new MessageMailboxOwnerMatcher([
			['mailchain-api', apiResolver1],
			['mailchain-api', apiResolver2],
		]);
	});

	it('should match message with two message owners', async () => {
		const matches = await ownerMatcher.findMatches(dummyMailData, AliceAccountMailbox);

		expect(matches).toEqual([
			{
				address: parseNameServiceAddress(dummyMailData.recipients[0].address),
				matchBy: 'mailchain-api',
			},
			{
				address: parseNameServiceAddress(dummyMailData.carbonCopyRecipients[0].address),
				matchBy: 'mailchain-api',
			},
			{
				address: parseNameServiceAddress(dummyMailData.blindCarbonCopyRecipients[0].address),
				matchBy: 'mailchain-api',
			},
		]);
		expect(apiResolver1).toHaveBeenCalledTimes(7);
		expect(apiResolver2).toHaveBeenCalledTimes(5);
	});

	it('should match additional withMessageIdentityKeys', async () => {
		const newMatcher = ownerMatcher.withMessageIdentityKeys(new Map());
		mockMessageHeaderResolver.mockImplementation(async (address) => {
			if (formatAddress(address, 'mail') === dummyMailData.recipients[0].address)
				return { identityKey: AliceAccountMailbox.identityKey, protocol: MAILCHAIN };
			if (formatAddress(address, 'mail') === dummyMailData.recipients[1].address)
				return { identityKey: AliceAccountMailbox.identityKey, protocol: MAILCHAIN };
			return { identityKey: new ED25519PublicKey(secureRandom(32)), protocol: MAILCHAIN };
		});

		const matches = await newMatcher.findMatches(dummyMailData, AliceAccountMailbox);

		expect(ownerMatcher).not.toEqual(newMatcher);
		expect(matches).toEqual([
			{
				address: parseNameServiceAddress(dummyMailData.recipients[0].address),
				matchBy: 'message-header',
			},
			{
				address: parseNameServiceAddress(dummyMailData.recipients[1].address),
				matchBy: 'message-header',
			},
			{
				address: parseNameServiceAddress(dummyMailData.carbonCopyRecipients[0].address),
				matchBy: 'mailchain-api',
			},
			{
				address: parseNameServiceAddress(dummyMailData.blindCarbonCopyRecipients[0].address),
				matchBy: 'mailchain-api',
			},
		]);
		expect(mockMessageHeaderResolver).toHaveBeenCalledTimes(7);
		expect(apiResolver1).toHaveBeenCalledTimes(5);
		expect(apiResolver2).toHaveBeenCalledTimes(4);
	});

	it('should match message with default mailbox alias when no address got matched', async () => {
		const matches = await ownerMatcher.findMatches(dummyMailData, AliceWalletMailbox);

		expect(matches).toEqual([{ address: AliceWalletMailbox.aliases[0].address, matchBy: 'fallback' }]);
		expect(apiResolver1).toHaveBeenCalledTimes(7);
		expect(apiResolver2).toHaveBeenCalledTimes(7);
	});

	it('should fail matching addresses when error is thrown by address resolver', async () => {
		const error = new Error('test');
		ownerMatcher = new MessageMailboxOwnerMatcher([['mailchain-api', () => Promise.reject(error)]]);

		expect(() => ownerMatcher.findMatches(dummyMailData, AliceAccountMailbox)).rejects.toThrow(error);
	});
});
