import {
	AddressesApiInterface,
	CryptoKeyConvert,
	GetAddressMessagingKeyResponseBody,
	IdentityKeysApiInterface,
} from '@mailchain/api';
import { ED25519PrivateKey } from '@mailchain/crypto';
import { mock } from 'jest-mock-extended';
import { AxiosResponse } from 'axios';
import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { MAILCHAIN } from '@mailchain/addressing';
import { MessagingKeyContractCall } from './messagingKeyContract';
import { MessagingKeys } from './messagingKeys';

describe('MessagingKeys', () => {
	const aliceMessagingKey = ED25519PrivateKey.generate();
	const bobMessagingKey = ED25519PrivateKey.generate();

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

	it('should resolve individual address', async () => {
		mockAddressesApiInterface.getAddressMessagingKeys.mockResolvedValue({
			data: [
				{
					contractCall: {
						protocol: MAILCHAIN,
					},
					identityKey: CryptoKeyConvert.public(AliceED25519PublicKey),
					fullAddress: 'alice@mailchain.test',
				},
			],
		} as AxiosResponse<GetAddressMessagingKeyResponseBody[]>);
		mockContractCallResolvers.resolve.mockResolvedValueOnce({
			data: {
				protocol: MAILCHAIN,
				messagingKey: aliceMessagingKey.publicKey,
				identityKey: AliceED25519PublicKey,
				type: 'registered',
				protocolAddress: 'alice',
				proof: expect.any(Object),
			},
		});

		const actual = await messagingKeys.resolveIndividual(
			'alice@mailchain.test',
			new Date('2022-05-19T08:00:00.000Z'),
		);

		expect(actual).toEqual({
			data: {
				mailchainAddress: 'alice@mailchain.test',
				identityKey: AliceED25519PublicKey,
				messagingKey: aliceMessagingKey.publicKey,
				protocol: MAILCHAIN,
				type: 'registered',
				protocolAddress: 'alice',
				proof: expect.any(Object),
			},
		});
		expect(mockAddressesApiInterface.getAddressMessagingKeys).toHaveBeenCalledWith(
			'alice@mailchain.test',
			1652947200,
		);
		expect(mockContractCallResolvers.resolve).toHaveBeenCalledWith({ protocol: MAILCHAIN }, AliceED25519PublicKey);
	});

	it('should resolve near group address', async () => {
		mockAddressesApiInterface.getAddressMessagingKeys.mockResolvedValue({
			data: [
				{
					contractCall: {
						protocol: 'near',
					},
					identityKey: CryptoKeyConvert.public(AliceED25519PublicKey),
					fullAddress: 'alice.near@near.mailchain.test',
				},
				{
					contractCall: {
						protocol: 'near',
					},
					identityKey: CryptoKeyConvert.public(BobED25519PublicKey),
					fullAddress: 'bob.near@near.mailchain.test',
				},
			],
		} as AxiosResponse<GetAddressMessagingKeyResponseBody[]>);
		mockContractCallResolvers.resolve
			.mockResolvedValueOnce({
				data: {
					protocol: 'near',
					messagingKey: aliceMessagingKey.publicKey,
					identityKey: AliceED25519PublicKey,
					type: 'registered',
					protocolAddress: 'alice.near',
					proof: expect.any(Object),
				},
			})
			.mockResolvedValueOnce({
				data: {
					protocol: 'near',
					messagingKey: bobMessagingKey.publicKey,
					identityKey: BobED25519PublicKey,
					type: 'vended',
					protocolAddress: 'bob.near',
				},
			});

		const actual = await messagingKeys.resolve(
			'group.near@near.mailchain.test',
			new Date('2022-05-19T08:00:00.000Z'),
		);

		expect(actual).toEqual({
			data: [
				{
					mailchainAddress: 'alice.near@near.mailchain.test',
					identityKey: AliceED25519PublicKey,
					messagingKey: aliceMessagingKey.publicKey,
					protocol: 'near',
					type: 'registered',
					protocolAddress: 'alice.near',
					proof: expect.any(Object),
				},
				{
					mailchainAddress: 'bob.near@near.mailchain.test',
					identityKey: BobED25519PublicKey,
					messagingKey: bobMessagingKey.publicKey,
					protocol: 'near',
					type: 'vended',
					protocolAddress: 'bob.near',
				},
			],
		});
		expect(mockAddressesApiInterface.getAddressMessagingKeys).toHaveBeenCalledWith(
			'group.near@near.mailchain.test',
			1652947200,
		);
		expect(mockContractCallResolvers.resolve).toHaveBeenCalledWith({ protocol: 'near' }, AliceED25519PublicKey);
		expect(mockContractCallResolvers.resolve).toHaveBeenCalledWith({ protocol: 'near' }, BobED25519PublicKey);
	});
});
