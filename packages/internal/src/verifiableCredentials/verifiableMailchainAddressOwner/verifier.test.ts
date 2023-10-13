import { mock } from 'jest-mock-extended';
import { AliceED25519PrivateKey, AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import {
	AliceSECP256K1PublicAddress,
	AliceSECP256K1PublicAddressStr,
} from '@mailchain/addressing/protocols/ethereum/test.const';
import { AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { MessagingKeys } from '../../messagingKeys';
import { mailchainAddressDecentralizedIdentifier } from '../did';
import { MailchainDIDMessagingKeyResolver, createDidDocumentFromResolvedAddress } from '../resolver';
import { MailchainMessagingKeyIssuer, createIssuerFromSigner } from '../issuer';
import { MailchainAddressOwnershipIssuer } from './issuer';
import { MailchainAddressOwnershipVerifier } from './verifier';

describe('verify', () => {
	const mockMessagingKeys = mock<MessagingKeys>();
	const mockMailchainMessagingKeyIssuer = mock<MailchainMessagingKeyIssuer>();
	const mockMailchainDIDMessagingKeyResolver = mock<MailchainDIDMessagingKeyResolver>();

	beforeEach(() => {
		jest.useFakeTimers().setSystemTime(new Date(2020, 1, 2));
		mockMessagingKeys.resolve.mockResolvedValue({
			data: {
				mailchainAddress: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
				messagingKey: AliceED25519PublicKey,
				protocol: 'ethereum',
				protocolAddress: AliceSECP256K1PublicAddressStr,
				type: 'registered',
				identityKey: AliceSECP256K1PublicKey,
				proof: {
					address: AliceSECP256K1PublicAddress,
					identityKey: AliceSECP256K1PublicKey,
					locale: 'locale',
					messageVariant: 'v1',
					messagingKey: AliceED25519PublicKey,
					nonce: 1,
					network: '',
					protocol: 'ethereum',
					signature: Uint8Array.from([1, 2, 3, 4]),
					signatureMethod: 'ethereum_personal_message',
					source: 'MailchainRegistry',
				},
			},
		});

		mockMailchainMessagingKeyIssuer.createIssuerFromResolvedAddress.mockResolvedValue({
			data: createIssuerFromSigner(
				`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
				AliceED25519PrivateKey,
			),
		});

		mockMailchainDIDMessagingKeyResolver.resolve.mockResolvedValue(
			createDidDocumentFromResolvedAddress(
				mailchainAddressDecentralizedIdentifier(`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`),
				{
					messagingKey: AliceED25519PublicKey,
					protocol: 'ethereum',
					protocolAddress: AliceSECP256K1PublicAddressStr,
					type: 'registered',
					mailchainAddress: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
					identityKey: AliceSECP256K1PublicKey,
					proof: {
						address: AliceSECP256K1PublicAddress,
						identityKey: AliceSECP256K1PublicKey,
						locale: 'locale',
						messageVariant: 'v1',
						messagingKey: AliceED25519PublicKey,
						nonce: 1,
						network: '',
						protocol: 'ethereum',
						signature: Uint8Array.from([1, 2, 3, 4]),
						signatureMethod: 'ethereum_personal_message',
						source: 'MailchainRegistry',
					},
				},
			),
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('mailchain-address-alice', async () => {
		const issuer = new MailchainAddressOwnershipIssuer(mockMessagingKeys, mockMailchainMessagingKeyIssuer);
		const verifier = new MailchainAddressOwnershipVerifier(mockMailchainDIDMessagingKeyResolver, mockMessagingKeys);

		const presentationResult = await issuer.createVerifiableMailchainAddressOwnership({
			address: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
			signer: AliceED25519PrivateKey,
			options: {
				requestId: 'request-id',
				expiresIn: 600,
				nonce: '1234',
			},
			actions: ['Authenticate', 'Join Meeting'],
			resources: ['*'],
			requester: 'app-example@mailchain.com',
		});
		const { data: presentation, error } = presentationResult;
		expect(presentation).toMatchSnapshot('presentation');
		expect(error).toBeUndefined();

		const verifyResult = await verifier.verifyMailchainAddressOwnership({
			presentation: presentation!,
			verifier: 'app-example@mailchain.com',
			nonce: '1234',
			actions: ['Authenticate', 'Join Meeting'],
			resources: ['*'],
			address: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
		});
		expect(verifyResult).toMatchSnapshot('result');

		expect(verifyResult.error).toBeUndefined();
	});

	it('mailchain address alice nonce not checked', async () => {
		const issuer = new MailchainAddressOwnershipIssuer(mockMessagingKeys, mockMailchainMessagingKeyIssuer);
		const verifier = new MailchainAddressOwnershipVerifier(mockMailchainDIDMessagingKeyResolver, mockMessagingKeys);
		const presentation = await issuer.createVerifiableMailchainAddressOwnership({
			address: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
			signer: AliceED25519PrivateKey,
			options: {
				requestId: 'request-id',
				expiresIn: 600,
				nonce: '1234',
			},
			actions: ['Authenticate', 'Join Meeting'],
			resources: ['*'],
			requester: 'app-example@mailchain.com',
		});
		const { data, error } = presentation;
		expect(data).toMatchSnapshot('presentation');
		expect(error).toBeUndefined();

		expect(
			await verifier.verifyMailchainAddressOwnership({
				presentation: data!,
				verifier: 'app-example@mailchain.com',
				actions: ['Authenticate', 'Join Meeting'],
				resources: ['*'],
				address: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
			}),
		).toMatchSnapshot('result');
	});
});
