import { createNameServiceAddress, ETHEREUM } from '@mailchain/addressing';
import { publicKeyToBytes } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { AxiosResponse } from 'axios';
import { mock, MockProxy } from 'jest-mock-extended';
import { GetIdentityKeyResolvableNamesResponseBody, IdentityKeysApiInterface } from '@mailchain/api';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { IdentityKeys } from '../identityKeys';
import { Nameservices } from './nameservices';

describe('Nameservices', () => {
	const aliceNs = createNameServiceAddress('alice.eth', 'ens', 'mailchain.test');
	let identityKeysApi: MockProxy<IdentityKeysApiInterface>;
	let identityKeysService: MockProxy<IdentityKeys>;
	let nameservices: Nameservices;

	beforeEach(() => {
		identityKeysApi = mock();
		identityKeysService = mock();
		nameservices = new Nameservices(identityKeysApi, identityKeysService, 'mailchain.test');
	});

	it('should reverse resolve names by identity key', async () => {
		const names = [
			{ name: 'alice.eth', resolver: 'ens' },
			{ name: 'alice.near', resolver: 'near' },
		];
		identityKeysApi.getIdentityKeyResolvableNames.mockResolvedValue({
			data: {
				resolvableNames: names,
			},
		} as AxiosResponse<GetIdentityKeyResolvableNamesResponseBody>);

		const result = await nameservices.reverseResolveNames(AliceSECP256K1PublicKey);

		expect(identityKeysApi.getIdentityKeyResolvableNames).toHaveBeenCalledWith(
			encodeHexZeroX(publicKeyToBytes(AliceSECP256K1PublicKey)),
		);
		expect(result).toEqual(
			names.map(({ name, resolver }) => ({
				name,
				resolver,
				address: createNameServiceAddress(name, resolver, 'mailchain.test'),
			})),
		);
	});

	it('should match alice.eth to AliceWallet mailbox', async () => {
		identityKeysService.getAddressIdentityKey.mockResolvedValue({
			identityKey: AliceSECP256K1PublicKey,
			protocol: ETHEREUM,
		});

		const matchedNs = await nameservices.nameResolvesToMailbox(aliceNs.username, AliceSECP256K1PublicKey);

		expect(matchedNs).toEqual(aliceNs);
		expect(identityKeysService.getAddressIdentityKey).toHaveBeenCalledWith(aliceNs);
	});

	it('should NOT match alice.eth to BobWallet mailbox', async () => {
		identityKeysService.getAddressIdentityKey.mockResolvedValue({
			identityKey: BobSECP256K1PublicKey,
			protocol: ETHEREUM,
		});

		const matches = await nameservices.nameResolvesToMailbox(aliceNs.username, AliceSECP256K1PublicKey);

		expect(matches).toBeNull();
		expect(identityKeysService.getAddressIdentityKey).toHaveBeenCalledWith(aliceNs);
	});

	it('should NOT match alice.eth because no identity key found', async () => {
		identityKeysService.getAddressIdentityKey.mockResolvedValue(null);

		const matches = await nameservices.nameResolvesToMailbox(aliceNs.username, AliceSECP256K1PublicKey);

		expect(matches).toBeNull();
		expect(identityKeysService.getAddressIdentityKey).toHaveBeenCalledWith(aliceNs);
	});
});
