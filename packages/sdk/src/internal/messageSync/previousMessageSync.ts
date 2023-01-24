import { PrivateKey } from '@mailchain/crypto';
import { encodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { encodeHexZeroX } from '@mailchain/encoding';
import { ETHEREUM } from '@mailchain/addressing/protocols';
import { ecdhKeyRingDecrypter, KeyRingDecrypter } from '@mailchain/keyring/functions';
import {
	Address as ApiAddress,
	IdentityKeysApiFactory,
	IdentityKeysApiInterface,
	MessagingKeysApiFactory,
	MessagingKeysApiInterface,
	ApiKeyConvert,
	createAxiosConfiguration,
	getAxiosWithSigner,
} from '@mailchain/api';
import { KeyRing } from '@mailchain/keyring';
import { Configuration } from '../..';
import { UserMailbox } from '../user/types';
import { MessageSync, SyncResult } from './messageSync';

export type PrevSyncResult = SyncResult & { address: ApiAddress };

export class PreviousMessageSync {
	constructor(
		private readonly identityKeysApi: IdentityKeysApiInterface,
		private readonly messagingKeysApiFactory: (messagingKey: KeyRingDecrypter) => MessagingKeysApiInterface,
		private readonly keyRing: KeyRing,
		private readonly messageSync: MessageSync,
	) {}

	static create(sdkConfig: Configuration, keyRing: KeyRing, messageSync: MessageSync) {
		const axiosConfig = createAxiosConfiguration(sdkConfig.apiPath);
		return new PreviousMessageSync(
			IdentityKeysApiFactory(axiosConfig),
			(messagingKey) => MessagingKeysApiFactory(axiosConfig, undefined, getAxiosWithSigner(messagingKey)),
			keyRing,
			messageSync,
		);
	}

	async sync(mailbox: UserMailbox): Promise<PrevSyncResult[]> {
		const messagingKey = this.keyRing.addressMessagingKey(
			mailbox.messagingKeyParams.address,
			mailbox.messagingKeyParams.protocol,
			mailbox.messagingKeyParams.nonce,
		);

		const messagingKeysApi = this.messagingKeysApiFactory(messagingKey);

		const encodedIdentityKey = encodeHexZeroX(encodePublicKey(mailbox.identityKey));
		const { addresses } = await this.identityKeysApi
			.getIdentityKeyAddresses(encodedIdentityKey)
			.then((r) => r.data);

		const aliasMessagingKeys: [ApiAddress, PrivateKey][] = await Promise.all(
			addresses.map(async (address) => {
				if (address.protocol !== ETHEREUM) {
					// TODO: MessagingKeysApi.getPrivateMessagingKey demands 'ethereum' as protocol.
					throw new Error(`unsupported protocol of [${address.protocol}] for [${address.value}]`);
				}
				// TODO: https://github.com/mailchain/monorepo/issues/405, the private key should be invalidated at the end of the sync
				const { privateKey: apiPrivateKey } = await messagingKeysApi
					.getPrivateMessagingKey(address.value, address.protocol, encodedIdentityKey)
					.then((r) => r.data);
				const privateKey = ApiKeyConvert.private(apiPrivateKey);

				return [address, privateKey];
			}),
		);

		const results: PrevSyncResult[] = [];
		for (const [address, aliasMessagingKey] of aliasMessagingKeys) {
			const tmpResult = await this.messageSync.syncWithMessagingKey(
				mailbox,
				ecdhKeyRingDecrypter(aliasMessagingKey),
			);
			results.push({ ...tmpResult, address });
		}
		return results;
	}
}
