import { encodePublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { AxiosResponse } from 'axios';
import { mock, MockProxy } from 'jest-mock-extended';
import { GetIdentityKeyResolvableNamesResponseBody, IdentityKeysApiInterface } from '../api';
import { AliceWalletMailbox } from '../user/test.const';
import { Nameservices } from './nameservices';

describe('Nameservices', () => {
	let identityKeysApi: MockProxy<IdentityKeysApiInterface>;
	let nameservices: Nameservices;

	beforeEach(() => {
		identityKeysApi = mock();
		nameservices = new Nameservices(identityKeysApi);
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

		const result = await nameservices.reverseResolveNames(AliceWalletMailbox.identityKey);

		expect(identityKeysApi.getIdentityKeyResolvableNames).toHaveBeenCalledWith(
			encodeHexZeroX(encodePublicKey(AliceWalletMailbox.identityKey)),
		);
		expect(result).toEqual(names);
	});
});
