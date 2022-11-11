import { encodePublicKey, isPublicKeyEqual, PublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { NameServiceAddress } from '@mailchain/addressing';
import { Configuration } from '../../mailchain';
import { IdentityKeysApiFactory, IdentityKeysApiInterface } from '../api';
import { createAxiosConfiguration } from '../axios/config';
import { UserMailbox } from '../user';
import { IdentityKeys } from '../identityKeys';

export type ResolvedName = {
	name: string;
	resolver: string;
};

export class Nameservices {
	constructor(
		private readonly identityKeysApi: IdentityKeysApiInterface,
		private readonly identityKeysService: IdentityKeys,
	) {}

	public static create(config: Configuration) {
		const identityKeysApi = IdentityKeysApiFactory(createAxiosConfiguration(config));
		const identityKeysService = IdentityKeys.create(config);

		return new Nameservices(identityKeysApi, identityKeysService);
	}

	async reverseResolveNames(identityKey: PublicKey): Promise<ResolvedName[]> {
		return this.identityKeysApi
			.getIdentityKeyResolvableNames(encodeHexZeroX(encodePublicKey(identityKey)))
			.then(({ data }) => data.resolvableNames ?? []);
	}

	async nameResolvesToMailbox(nsAddress: NameServiceAddress, mailbox: UserMailbox): Promise<boolean> {
		const addressIdentityKey = await this.identityKeysService.getAddressIdentityKey(nsAddress);

		if (addressIdentityKey == null) return false;

		return isPublicKeyEqual(addressIdentityKey.identityKey, mailbox.identityKey);
	}
}
