import { AddressesApiInterface, IdentityKeysApiInterface } from '@mailchain/api';
import { convertPublic } from '@mailchain/api/helpers/cryptoKeyToApiKey';
import { ED25519PrivateKey } from '@mailchain/crypto';
import { mock, MockProxy } from 'jest-mock-extended';
import { MessagingKeyContractCall } from './messagingKeyContract';
import { MessagingKeys } from './messagingKeys';

describe('MessagingKeys', () => {
	const messagingKey = ED25519PrivateKey.generate();
	const identityKey = ED25519PrivateKey.generate();

	const mockAddressesApiInterface: MockProxy<AddressesApiInterface> = mock();
	const mockIdentityKeysApiInterface: MockProxy<IdentityKeysApiInterface> = mock();
	const mockContractCallResolvers: MockProxy<MessagingKeyContractCall> = mock();
	let messagingKeys: MessagingKeys;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();

		messagingKeys = new MessagingKeys(
			mockAddressesApiInterface,
			mockIdentityKeysApiInterface,
			mockContractCallResolvers,
		);
	});

	it('from contract', async () => {
		mockAddressesApiInterface.getAddressMessagingKey.mockResolvedValue({
			data: {
				protocol: 'near',
				contractCall: {
					contractAddress: 'alice.near',
					method: 'getMessagingKey',
					body: '[]',
					identityKey: convertPublic(identityKey.publicKey),
				},
			},
		} as any);

		mockContractCallResolvers.resolve.mockResolvedValue({
			data: {
				protocol: 'near',
				messagingKey: messagingKey.publicKey,
				identityKey: identityKey.publicKey,
				type: 'registered',
			},
		});

		const actual = await messagingKeys.resolve('alice.near@near.mailchain.com');

		expect(actual).toEqual({
			data: {
				identityKey: identityKey.publicKey,
				messagingKey: messagingKey.publicKey,
				protocol: 'near',
				type: 'registered',
			},
		});
	});
});
