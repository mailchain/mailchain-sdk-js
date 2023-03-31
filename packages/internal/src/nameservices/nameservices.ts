import { encodePublicKey, isPublicKeyEqual, PublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { createNameServiceAddress, NameServiceAddress } from '@mailchain/addressing';
import { NAMESERVICE_DESCRIPTIONS } from '@mailchain/addressing/nameservices';
import { IdentityKeysApiFactory, IdentityKeysApiInterface, createAxiosConfiguration } from '@mailchain/api';
import { Configuration } from '../configuration';
import { IdentityKeys } from '../identityKeys';

export type ResolvedName = {
	name: string;
	resolver: string;
	address: NameServiceAddress;
};

export class Nameservices {
	constructor(
		private readonly identityKeysApi: IdentityKeysApiInterface,
		private readonly identityKeysService: IdentityKeys,
		private readonly mailchainAddressDomain: string,
	) {}

	public static create(config: Configuration) {
		const identityKeysApi = IdentityKeysApiFactory(createAxiosConfiguration(config.apiPath));
		const identityKeysService = IdentityKeys.create(config);

		return new Nameservices(identityKeysApi, identityKeysService, config.mailchainAddressDomain);
	}

	async reverseResolveNames(identityKey: PublicKey): Promise<ResolvedName[]> {
		return this.identityKeysApi.getIdentityKeyResolvableNames(encodeHexZeroX(encodePublicKey(identityKey))).then(
			({ data }) =>
				data.resolvableNames?.map((resolved) => ({
					...resolved,
					address: createNameServiceAddress(resolved.name, resolved.resolver, this.mailchainAddressDomain),
				})) ?? [],
			(e) => {
				console.error(e);
				return [];
			},
		);
	}

	async nameResolvesToMailbox(nsName: string, mailboxIdentityKey: PublicKey): Promise<NameServiceAddress | null> {
		for (const nsDesc of NAMESERVICE_DESCRIPTIONS) {
			const nsAddress = createNameServiceAddress(nsName, nsDesc.name, this.mailchainAddressDomain);
			const addressIdentityKey = await this.identityKeysService.getAddressIdentityKey(nsAddress);

			if (addressIdentityKey != null && isPublicKeyEqual(addressIdentityKey.identityKey, mailboxIdentityKey)) {
				return nsAddress;
			}
		}

		return null;
	}
}
