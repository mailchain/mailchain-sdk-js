import { publicKeyToBytes, isPublicKeyEqual, PublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import {
	checkAddressForErrors,
	formatAddress,
	isTokenAddress,
	parseNameServiceAddress,
	createNameServiceAddress,
	ETHEREUM,
	NameServiceAddress,
	SOLANA,
	TEZOS,
} from '@mailchain/addressing';
import { NAMESERVICE_DESCRIPTIONS } from '@mailchain/addressing/nameservices';
import { IdentityKeysApiFactory, IdentityKeysApiInterface, createAxiosConfiguration } from '@mailchain/api';
import { Configuration } from '../configuration';
import { IdentityKeys } from '../identityKeys';
import { UserMailbox } from '../user';

export const PROTOCOLS_SUPPORTING_NAMESERVICE = [ETHEREUM, TEZOS, SOLANA] as const;

export type ResolvedName = {
	kind: 'name' | 'token';
	address: NameServiceAddress;
	resolver?: string;
	metadata?: object;
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

	async reverseResolveNames(identityKey: PublicKey, kind?: ResolvedName['kind'][]): Promise<ResolvedName[]> {
		return this.identityKeysApi
			.getIdentityKeyResolvableNames(encodeHexZeroX(publicKeyToBytes(identityKey)), kind)
			.then(({ data }) => {
				return (data.resolvableNames ?? []).map((resolved) => ({
					kind: resolved.kind as ResolvedName['kind'],
					address: parseNameServiceAddress(resolved.fullAddress),
					resolver: resolved.resolver,
					metadata: resolved.metadata ?? undefined,
				}));
			});
	}

	async nameResolvesToMailbox(nsName: string, mailboxIdentityKey: PublicKey): Promise<NameServiceAddress | null> {
		for (const nsDesc of NAMESERVICE_DESCRIPTIONS) {
			const nsAddress = createNameServiceAddress(nsName, nsDesc.name, this.mailchainAddressDomain);
			try {
				const addressIdentityKey = await this.identityKeysService.getAddressIdentityKey(nsAddress);

				if (
					addressIdentityKey != null &&
					isPublicKeyEqual(addressIdentityKey.identityKey, mailboxIdentityKey)
				) {
					return nsAddress;
				}
			} catch (e) {
				console.log(`failed to resolve address: ${formatAddress(nsAddress, 'mail')}`, e);
			}
		}

		return null;
	}

	async tokenResolvesToMailbox(
		tokenId: string,
		contractAddress: string,
		mailbox: UserMailbox,
	): Promise<NameServiceAddress | null> {
		const { protocol } = mailbox.messagingKeyParams;

		const contractNsAddress = createNameServiceAddress(contractAddress, protocol, this.mailchainAddressDomain);

		const contractAddressError = checkAddressForErrors(
			formatAddress(contractNsAddress, 'mail'),
			this.mailchainAddressDomain,
		);

		if (contractAddressError != null) {
			throw new Error(`Invalid contract address ${contractAddress} for protocol ${protocol}`);
		}

		const tokenNsAddress = createNameServiceAddress(
			`${tokenId}.${contractAddress}`,
			protocol,
			this.mailchainAddressDomain,
		);
		if (!isTokenAddress(tokenNsAddress)) {
			throw new Error(`Invalid address ${formatAddress(tokenNsAddress, 'mail')}`);
		}

		try {
			const tokenAddressIdentityKey = await this.identityKeysService.getAddressIdentityKey(tokenNsAddress);

			if (
				tokenAddressIdentityKey != null &&
				isPublicKeyEqual(tokenAddressIdentityKey.identityKey, mailbox.identityKey)
			) {
				return tokenNsAddress;
			}
		} catch (e) {
			console.log(`failed to resolve address: ${formatAddress(tokenNsAddress, 'mail')}`, e);
		}
		return null;
	}
}
