import { ETHEREUM, NEAR, ProtocolNotSupportedError, ProtocolType } from '@mailchain/addressing/protocols';
import { ContractCall, GetMessagingKeyResponseBody, MessagingKeysApiInterface } from '@mailchain/api';
import { convertPublic } from '@mailchain/api/helpers/cryptoKeyToApiKey';
import { ED25519PrivateKey } from '@mailchain/crypto';
import { mock, MockProxy } from 'jest-mock-extended';
import { AxiosResponse } from 'axios';
import { MessagingKeyContractCall } from './messagingKeyContract';
import { ContractCallMessagingKeyResolver } from './contractResolvers/resolver';
import { MessagingKeyVerifier } from './verify';
import { MessagingKeyNotFoundInContractError } from './contractResolvers/errors';

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
			data: {
				protocol: NEAR,
				messagingKey: messagingKey.publicKey,
			},
		});

		resolvers.set(NEAR, nearResolver);

		const actual = await messagingKeyContractCall.resolve(
			NEAR,
			{
				body: 'body',
				method: 'POST',
			} as ContractCall,
			identityKey.publicKey,
		);

		expect(actual).toEqual({
			data: {
				identityKey: identityKey.publicKey,
				messagingKey: messagingKey.publicKey,
				protocol: 'near',
				type: 'registered',
			},
		});
	});

	it('not found from contract', async () => {
		nearResolver.resolve.mockResolvedValueOnce({ error: new MessagingKeyNotFoundInContractError() });

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
		} as AxiosResponse<GetMessagingKeyResponseBody>);

		resolvers.set(NEAR, nearResolver);

		const actual = await messagingKeyContractCall.resolve(
			NEAR,
			{
				body: 'body',
				method: 'POST',
			} as ContractCall,
			identityKey.publicKey,
		);

		expect(actual).toEqual({
			data: {
				identityKey: identityKey.publicKey,
				messagingKey: messagingKey.publicKey,
				protocol: 'near',
				type: 'vended',
			},
		});
	});

	it('no contract for protocol', async () => {
		resolvers.set(NEAR, nearResolver);

		expect(
			await messagingKeyContractCall.resolve(ETHEREUM, {
				body: 'body',
				method: 'POST',
				identityKey: convertPublic(identityKey.publicKey),
				endpoint: 'http://endpoint',
				address: 'address',
				path: '/',
				protocol: 'near',
			} as ContractCall),
		).toEqual({ error: new ProtocolNotSupportedError(ETHEREUM) });
	});
});
