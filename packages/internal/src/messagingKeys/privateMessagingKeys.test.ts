import { mock } from 'jest-mock-extended';
import { AliceSECP256K1PublicAddressStr } from '@mailchain/addressing/protocols/ethereum/test.const';
import { ETHEREUM } from '@mailchain/addressing';
import { AliceSECP256K1PrivateKey, AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { KeyRing } from '@mailchain/keyring';
import { UnexpectedMailchainError } from '../errors';
import { MessagingKeys, ResolvedAddressItem } from './messagingKeys';
import { PrivateMessagingKeys } from './privateMessagingKeys';
import { AddressNonce } from './addressNonce';

const mockMessagingKeys = mock<MessagingKeys>();
mockMessagingKeys.resolveIndividual.mockResolvedValue({
	data: {
		type: 'registered',
		protocolAddress: AliceSECP256K1PublicAddressStr,
		protocol: ETHEREUM,
		messagingKey: AliceSECP256K1PublicKey,
	} as ResolvedAddressItem,
});

const mockAddressNonce = mock<AddressNonce>();
mockAddressNonce.getMessagingKeyLatestNonce.mockResolvedValue({ data: 1337 });

const mockKeyRing = mock<KeyRing>();
mockKeyRing.addressExportableMessagingKey.mockReturnValue(AliceSECP256K1PrivateKey);

describe('PrivateMessagingKeys', () => {
	let privateMessagingKeys: PrivateMessagingKeys;

	beforeEach(() => {
		jest.clearAllMocks();
		privateMessagingKeys = new PrivateMessagingKeys(mockMessagingKeys, mockAddressNonce);
	});

	it('should get private messaging key', async () => {
		const result = await privateMessagingKeys.getExportablePrivateMessagingKey(
			`${AliceSECP256K1PublicAddressStr}@${ETHEREUM}.mailchain.test`,
			mockKeyRing,
		);

		expect(result).toEqual({ data: AliceSECP256K1PrivateKey });
		expect(mockMessagingKeys.resolveIndividual).toHaveBeenCalledWith(
			`${AliceSECP256K1PublicAddressStr}@${ETHEREUM}.mailchain.test`,
		);
		expect(mockAddressNonce.getMessagingKeyLatestNonce).toHaveBeenCalledWith(
			AliceSECP256K1PublicAddressStr,
			ETHEREUM,
		);
		expect(mockKeyRing.addressExportableMessagingKey).toHaveBeenCalledWith(
			AliceSECP256K1PublicAddressStr,
			ETHEREUM,
			1337,
		);
	});

	it('should fail for unregistered/vended messaging key', async () => {
		mockMessagingKeys.resolveIndividual.mockResolvedValueOnce({ data: { type: 'vended' } as ResolvedAddressItem });

		const result = await privateMessagingKeys.getExportablePrivateMessagingKey(
			`${AliceSECP256K1PublicAddressStr}@${ETHEREUM}.mailchain.test`,
			mockKeyRing,
		);

		expect(result).toMatchInlineSnapshot(`
		{
		  "error": [Error: Address is not registered. Register address, then try again.],
		}
	`);
	});

	it('should fail for nonce error', async () => {
		mockAddressNonce.getMessagingKeyLatestNonce.mockResolvedValueOnce({
			error: new UnexpectedMailchainError('failed nonce get'),
		});

		const result = await privateMessagingKeys.getExportablePrivateMessagingKey(
			`${AliceSECP256K1PublicAddressStr}@${ETHEREUM}.mailchain.test`,
			mockKeyRing,
		);

		expect(result).toMatchInlineSnapshot(`
		{
		  "error": [Error: failed nonce get],
		}
	`);
	});
});
