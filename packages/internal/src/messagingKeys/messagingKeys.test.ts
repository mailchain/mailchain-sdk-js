import {
	AddressesApiInterface,
	CryptoKeyConvert,
	GetAddressMessagingKeyResponseBody,
	IdentityKeysApiInterface,
} from '@mailchain/api';
import { ED25519PrivateKey } from '@mailchain/crypto';
import { mock } from 'jest-mock-extended';
import { AxiosResponse } from 'axios';
import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { MessagingKeyContractCall } from './messagingKeyContract';
import { MessagingKeys } from './messagingKeys';

describe('MessagingKeys', () => {
	const messagingKey = ED25519PrivateKey.generate();
	const identityKey = ED25519PrivateKey.generate();

	const mockAddressesApiInterface = mock<AddressesApiInterface>();
	const mockIdentityKeysApiInterface = mock<IdentityKeysApiInterface>();
	const mockContractCallResolvers = mock<MessagingKeyContractCall>();
	let messagingKeys: MessagingKeys;

	beforeEach(() => {
		jest.clearAllMocks();

		messagingKeys = new MessagingKeys(
			mockAddressesApiInterface,
			mockIdentityKeysApiInterface,
			mockContractCallResolvers,
			'mailchain.test',
		);
	});

	it('from contract', async () => {
		mockAddressesApiInterface.getAddressMessagingKey.mockResolvedValue({
			data: {
				contractCall: {
					protocol: 'near',
				},
				identityKey: CryptoKeyConvert.public(AliceED25519PublicKey),
			},
		} as AxiosResponse<GetAddressMessagingKeyResponseBody>);
		mockContractCallResolvers.resolve.mockResolvedValue({
			data: {
				protocol: 'near',
				messagingKey: messagingKey.publicKey,
				identityKey: identityKey.publicKey,
				type: 'registered',
				protocolAddress: 'alice.near',
				proof: expect.any(Object),
			},
		});

		const actual = await messagingKeys.resolve(
			'alice.near@near.mailchain.test',
			new Date('2022-05-19T08:00:00.000Z'),
		);

		expect(actual).toEqual({
			data: {
				mailchainAddress: 'alice.near@near.mailchain.test',
				identityKey: identityKey.publicKey,
				messagingKey: messagingKey.publicKey,
				protocol: 'near',
				type: 'registered',
				protocolAddress: 'alice.near',
				proof: expect.any(Object),
			},
		});
		expect(mockAddressesApiInterface.getAddressMessagingKey).toHaveBeenCalledWith(
			'alice.near@near.mailchain.test',
			1652947200,
		);
		expect(mockContractCallResolvers.resolve).toHaveBeenCalledWith({ protocol: 'near' }, AliceED25519PublicKey);
	});
});
