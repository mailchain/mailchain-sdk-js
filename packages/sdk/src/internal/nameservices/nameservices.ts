import { encodePublicKey, PublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { Configuration } from '../../mailchain';
import { IdentityKeysApiFactory, IdentityKeysApiInterface } from '../api';
import { createAxiosConfiguration } from '../axios/config';

export type ResolvedName = {
	name: string;
	resolver: string;
};

export class Nameservices {
	constructor(private readonly identityKeysApi: IdentityKeysApiInterface) {}

	public static create(config: Configuration) {
		const identityKeysApi = IdentityKeysApiFactory(createAxiosConfiguration(config));
		return new Nameservices(identityKeysApi);
	}

	async reverseResolveNames(identityKey: PublicKey): Promise<ResolvedName[]> {
		return this.identityKeysApi
			.getIdentityKeyResolvableNames(encodeHexZeroX(encodePublicKey(identityKey)))
			.then(({ data }) => data.resolvableNames ?? []);
	}
}
