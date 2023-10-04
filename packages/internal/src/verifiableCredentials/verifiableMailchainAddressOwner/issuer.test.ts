import { mock } from 'jest-mock-extended';
import {
	AliceED25519PrivateKey,
	AliceED25519PublicKey,
	BobED25519PrivateKey,
	BobED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';
import {
	AliceSECP256K1PublicAddress,
	AliceSECP256K1PublicAddressStr,
	BobSECP256K1PublicAddress,
	BobSECP256K1PublicAddressStr,
} from '@mailchain/addressing/protocols/ethereum/test.const';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { decodeBase64, encodeUtf8 } from '@mailchain/encoding';
import { MessagingKeys } from '../../messagingKeys';
import { MailchainMessagingKeyIssuer, createIssuerFromSigner } from '../issuer';
import { MailchainAddressOwnershipIssuer } from './issuer';

const mockMessagingKeys = mock<MessagingKeys>();
mockMessagingKeys.resolve.calledWith(`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`).mockResolvedValue({
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
mockMessagingKeys.resolve.calledWith(`${BobSECP256K1PublicAddressStr}@ethereum.mailchain.com`).mockResolvedValue({
	data: {
		mailchainAddress: `${BobSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
		messagingKey: BobED25519PublicKey,
		protocol: 'ethereum',
		protocolAddress: BobSECP256K1PublicAddressStr,
		type: 'registered',
		identityKey: BobSECP256K1PublicKey,
		proof: {
			address: BobSECP256K1PublicAddress,
			identityKey: BobSECP256K1PublicKey,
			locale: 'locale',
			messageVariant: 'v1',
			messagingKey: BobED25519PublicKey,
			nonce: 1,
			network: '',
			protocol: 'ethereum',
			signature: Uint8Array.from([1, 2, 3, 4]),
			signatureMethod: 'ethereum_personal_message',
			source: 'MailchainRegistry',
		},
	},
});

const mockMailchainMessagingKeyIssuer = mock<MailchainMessagingKeyIssuer>();

describe('issuer', () => {
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date(2020, 1, 2));
	});

	let issuer: MailchainAddressOwnershipIssuer;

	beforeEach(() => {
		jest.clearAllMocks();

		issuer = new MailchainAddressOwnershipIssuer(mockMessagingKeys, mockMailchainMessagingKeyIssuer);
	});
	it('mailchain-address-alice', async () => {
		mockMailchainMessagingKeyIssuer.createIssuerFromResolvedAddress.mockResolvedValue({
			data: createIssuerFromSigner(
				`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
				AliceED25519PrivateKey,
			),
		});

		const result = await issuer.createVerifiableMailchainAddressOwnership({
			address: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
			signer: AliceED25519PrivateKey,
			options: {
				expiresIn: 600,
				nonce: '1234',
			},
			actions: ['Authenticate', 'Join Meeting'],
			resources: ['*'],
			requester: 'app-example@mailchain.com',
		});

		expect(result.error).toBeUndefined();
		expect(result.data).toMatchSnapshot();
		expect(encodeUtf8(decodeBase64(result.data!.split('.')[1]))).toMatchSnapshot();
	});

	it('mailchain-address-bob', async () => {
		mockMailchainMessagingKeyIssuer.createIssuerFromResolvedAddress.mockResolvedValue({
			data: createIssuerFromSigner(
				`${BobSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
				BobED25519PrivateKey,
			),
		});

		const result = await issuer.createVerifiableMailchainAddressOwnership({
			address: `${BobSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
			signer: BobED25519PrivateKey,
			options: {
				expiresIn: 600,
				nonce: '1234',
			},
			actions: ['Authenticate', 'Join Meeting'],
			resources: ['*'],
			requester: 'app-example@mailchain.com',
		});

		expect(result.error).toBeUndefined();
		expect(result.data).toMatchSnapshot();
		expect(encodeUtf8(decodeBase64(result.data!.split('.')[1]))).toMatchSnapshot();
	});
});
