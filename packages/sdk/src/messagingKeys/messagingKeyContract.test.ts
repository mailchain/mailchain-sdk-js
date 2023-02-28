import { ETHEREUM, NEAR, ProtocolType } from '@mailchain/addressing/protocols';
import { ContractCall, MessagingKeysApiInterface } from '@mailchain/api';
import { convertPublic } from '@mailchain/api/helpers/cryptoKeyToApiKey';
import { ED25519PrivateKey } from '@mailchain/crypto';
import { mock, MockProxy } from 'jest-mock-extended';
import { MessagingKeyContractCall } from './messagingKeyContract';
import { ContractCallMessagingKeyResolver, ContractMessagingKeyResponse } from './contractResolvers/resolver';
import { MessagingKeyVerifier } from './verify';

let messagingKeyContractCall: MessagingKeyContractCall;
describe('MessagingKeyContractCall', () => {
	const messagingKey = ED25519PrivateKey.generate();
	const identityKey = ED25519PrivateKey.generate();

	const resolvers = new Map<ProtocolType, ContractCallMessagingKeyResolver>();
	const nearResolver: MockProxy<ContractCallMessagingKeyResolver> = mock();
	const mockMessagingKeysApi: MockProxy<MessagingKeysApiInterface> = mock();
	const mockMessagingKeyVerifier: MockProxy<MessagingKeyVerifier> = mock();

	messagingKeyContractCall = new MessagingKeyContractCall(resolvers, mockMessagingKeysApi, mockMessagingKeyVerifier);

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	it('found from contract', async () => {
		nearResolver.resolve.mockResolvedValueOnce({
			status: 'ok',
			address: 'address',
			protocol: NEAR,
			messagingKey: messagingKey.publicKey,
			identityKey: identityKey.publicKey,
		} as ContractMessagingKeyResponse);

		resolvers.set(NEAR, nearResolver);

		const actual = await messagingKeyContractCall.resolve(
			'alice.near',
			NEAR,
			{
				body: 'body',
				method: 'POST',
			} as ContractCall,
			identityKey.publicKey,
		);

		expect(actual).toEqual({
			identityKey: identityKey.publicKey,
			messagingKey: messagingKey.publicKey,
			protocol: 'near',
			status: 'registered',
		});
	});

	it('not found from contract', async () => {
		nearResolver.resolve.mockResolvedValueOnce({
			status: 'not-found',
		} as ContractMessagingKeyResponse);

		mockMessagingKeyVerifier.verifyProvidedKeyProof.mockResolvedValueOnce(true);
		mockMessagingKeysApi.getVendedPublicMessagingKey.mockResolvedValueOnce({
			data: {
				messagingKey: convertPublic(messagingKey.publicKey),
				proof: {
					address: 'address',
					protocol: NEAR,
					signature: 'signature',
				},
			},
		} as any);

		resolvers.set(NEAR, nearResolver);

		const actual = await messagingKeyContractCall.resolve(
			'alice.near',
			NEAR,
			{
				body: 'body',
				method: 'POST',
			} as ContractCall,
			identityKey.publicKey,
		);

		expect(actual).toEqual({
			identityKey: identityKey.publicKey,
			messagingKey: messagingKey.publicKey,
			protocol: 'near',
			status: 'vended',
		});
	});

	it('no contract for protocol', async () => {
		resolvers.set(NEAR, nearResolver);

		expect.assertions(1);

		await expect(
			messagingKeyContractCall.resolve('alice.near', ETHEREUM, {
				body: 'body',
				method: 'POST',
				identityKey: convertPublic(identityKey.publicKey),
				endpoint: 'http://endpoint',
				address: 'address',
				path: '/',
				protocol: 'near',
			} as ContractCall),
		).rejects.toThrow('No resolver for protocol ethereum');
	});
});
