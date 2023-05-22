import { PrivateKey, publicKeyToBytes } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { isBlockchainProtocolEnabled } from '@mailchain/addressing/protocols';
import { ecdhKeyRingDecrypter, KeyRingDecrypter } from '@mailchain/keyring/functions';
import {
	MessagingKeysApiFactory,
	MessagingKeysApiInterface,
	ApiKeyConvert,
	createAxiosConfiguration,
	getAxiosWithSigner,
} from '@mailchain/api';
import { KeyRing } from '@mailchain/keyring';
import uniqBy from 'lodash/uniqBy';
import { encodeAddressByProtocol } from '@mailchain/addressing';
import { IdentityKeys } from '../identityKeys';
import { Configuration } from '..';
import { UserMailbox } from '../user/types';
import { MessageSync, SyncResult } from './messageSync';

type Address = {
	protocol: string;
	address: string;
};
export type PrevSyncResult = SyncResult & { address: Address };

export class PreviousMessageSync {
	constructor(
		private readonly identityKeys: IdentityKeys,
		private readonly messagingKeysApiFactory: (messagingKey: KeyRingDecrypter) => MessagingKeysApiInterface,
		private readonly keyRing: KeyRing,
		private readonly messageSync: MessageSync,
	) {}

	static create(sdkConfig: Configuration, keyRing: KeyRing, messageSync: MessageSync) {
		const axiosConfig = createAxiosConfiguration(sdkConfig.apiPath);
		return new PreviousMessageSync(
			IdentityKeys.create(sdkConfig),
			(messagingKey) => MessagingKeysApiFactory(axiosConfig, undefined, getAxiosWithSigner(messagingKey)),
			keyRing,
			messageSync,
		);
	}

	async sync(mailbox: UserMailbox): Promise<PrevSyncResult[]> {
		const messagingKeysApi = this.messagingKeysApiFactory(
			this.keyRing.addressMessagingKey(
				encodeAddressByProtocol(mailbox.messagingKeyParams.address, mailbox.messagingKeyParams.protocol)
					.encoded,
				mailbox.messagingKeyParams.protocol,
				mailbox.messagingKeyParams.nonce,
			),
		);

		const encodedIdentityKey = encodeHexZeroX(publicKeyToBytes(mailbox.identityKey));
		const addresses = await this.identityKeys.reverse(mailbox.identityKey);

		// add all address found by identity key and also registered
		const allAddresses = uniqBy(
			[
				...addresses.map(
					(x) =>
						({
							protocol: x.protocol,
							address: x.value,
						} as Address),
				),
				...mailbox.aliases.map(
					(x) =>
						({
							address: x.address.username,
							protocol: mailbox.messagingKeyParams.protocol,
						} as Address),
				),
			],
			(x) => x.address + x.protocol,
		);

		type AddressToCheck = { address: Address; messagingKey: PrivateKey };
		// type Address
		// const aliasMessagingKeyss: [Address, PrivateKey][] = [];

		const aliasMessagingKeys = await Promise.allSettled(
			allAddresses.map(async (x) => {
				if (!isBlockchainProtocolEnabled(x.protocol)) {
					throw new Error(`unsupported protocol of [${x.protocol}] for [${x.address}]`);
				}
				// TODO: https://github.com/mailchain/monorepo/issues/405, the private key should be invalidated at the end of the sync
				const { privateKey: apiPrivateKey } = await messagingKeysApi
					.getVendedPrivateMessagingKey(x.address, x.protocol, encodedIdentityKey)
					.then((r) => r.data);

				return { address: x, messagingKey: ApiKeyConvert.private(apiPrivateKey) } as AddressToCheck;
			}),
		);

		const filteredAliasMessagingKeys: AddressToCheck[] = [];
		aliasMessagingKeys.forEach((x) => {
			if (x.status === 'fulfilled') {
				filteredAliasMessagingKeys.push(x.value);
			}
		});

		const results: PrevSyncResult[] = [];
		for (const x of filteredAliasMessagingKeys) {
			const { address, messagingKey } = x;
			const tmpResult = await this.messageSync.syncWithMessagingKey(mailbox, ecdhKeyRingDecrypter(messagingKey));
			results.push({ ...tmpResult, address });
		}
		return results;
	}
}
