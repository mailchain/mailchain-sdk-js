import { AliceSECP256K1PublicAddressStr } from '@mailchain/addressing/protocols/ethereum/test.const';
import { mock } from 'jest-mock-extended';
import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { MessagingKeys, Proof } from '../messagingKeys';
import { MailchainDIDMessagingKeyResolver } from './resolver';

describe('MailchainDIDMessagingKeyResolver', () => {
	it('should resolve', async () => {
		const mockMessagingKeys = mock<MessagingKeys>();
		mockMessagingKeys.resolveIndividual.mockResolvedValue({
			data: {
				mailchainAddress: `${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
				messagingKey: AliceED25519PublicKey,
				protocol: 'ethereum',
				protocolAddress: AliceSECP256K1PublicAddressStr,
				type: 'registered',
				identityKey: AliceSECP256K1PublicKey,
				proof: {} as Proof,
			},
		});

		const target = new MailchainDIDMessagingKeyResolver(mockMessagingKeys);
		const result = await target.resolve(`did:mailchain:${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`);
		expect(result).toMatchSnapshot('result');
		expect(mockMessagingKeys.resolveIndividual).toHaveBeenCalledWith(
			`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.com`,
		);
	});
});
