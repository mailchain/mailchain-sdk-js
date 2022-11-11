import { createNameServiceAddress, createWalletAddress, ETHEREUM, formatAddress } from '@mailchain/addressing';
import { AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import {
	AliceSECP256K1PublicAddressStr,
	BobSECP256K1PublicAddressStr,
} from '@mailchain/addressing/protocols/ethereum/test.const';
import { createMessageHeaderIdentityKeyResolver } from './addressIdentityKeyResolver';

describe('MessageHeaderIdentityKeyResolver', () => {
	const aliceAddress = createWalletAddress(AliceSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test');
	const aliceAddressResolution = { identityKey: AliceSECP256K1PublicKey, protocol: ETHEREUM };

	const bobAddress = createWalletAddress(BobSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test');

	it('should resolve ethereum address identity key', async () => {
		const resolver = createMessageHeaderIdentityKeyResolver(
			new Map([[formatAddress(aliceAddress, 'mail'), aliceAddressResolution]]),
		);

		const resolved = await resolver(aliceAddress);

		expect(resolved).toEqual(aliceAddressResolution);
	});

	it('should not resolve ethereum address identity key because not matching key<->address', async () => {
		const resolver = createMessageHeaderIdentityKeyResolver(
			new Map([[formatAddress(bobAddress, 'mail'), aliceAddressResolution]]),
		);

		const resolved = await resolver(aliceAddress);

		expect(resolved).toBeNull();
	});

	it('should not resolve ethereum address identity key address is not decodable', async () => {
		const aliceEthAddress = createNameServiceAddress('alice.eth', 'mailchain.test');
		const resolver = createMessageHeaderIdentityKeyResolver(
			new Map([[formatAddress(aliceEthAddress, 'mail'), aliceAddressResolution]]),
		);

		const resolved = await resolver(aliceEthAddress);

		expect(resolved).toBeNull();
	});

	it('should not resolve address because there is no entry for it', async () => {
		const resolver = createMessageHeaderIdentityKeyResolver(
			new Map([[formatAddress(aliceAddress, 'mail'), aliceAddressResolution]]),
		);

		const resolved = await resolver(bobAddress);

		expect(resolved).toBeNull();
	});
});
