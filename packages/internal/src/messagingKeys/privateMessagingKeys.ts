import { PrivateKey } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import { SenderMessagingKeyIncorrect } from '@mailchain/signatures';
import isEqual from 'lodash/isEqual';
import { MailchainResult } from '..';
import { Configuration } from '../configuration';
import { AddressNonce, GetMessagingKeyLatestNonceError } from './addressNonce';
import { MessagingKeys, ResolveAddressError } from './messagingKeys';
import { MessagingKeyNotRegisteredError } from './errors';

export type GetExportablePrivateMessagingKeyError =
	| ResolveAddressError
	| GetMessagingKeyLatestNonceError
	| SenderMessagingKeyIncorrect
	| MessagingKeyNotRegisteredError;

export class PrivateMessagingKeys {
	constructor(private readonly messagingKeys: MessagingKeys, private readonly addressNonce: AddressNonce) {}

	static create(config: Configuration) {
		return new PrivateMessagingKeys(MessagingKeys.create(config), AddressNonce.create(config));
	}

	async getExportablePrivateMessagingKey(
		address: string,
		keyRing: KeyRing,
	): Promise<MailchainResult<PrivateKey, GetExportablePrivateMessagingKeyError>> {
		const { data: resolvedAddress, error: resolveAddressError } = await this.messagingKeys.resolve(address);

		if (resolveAddressError != null) {
			return { error: resolveAddressError };
		}

		const { data: getMessagingKeyLatestNonce, error: getMessagingKeyLatestNonceError } =
			await this.addressNonce.getMessagingKeyLatestNonce(address, resolvedAddress.protocol);

		if (getMessagingKeyLatestNonceError != null) {
			return { error: getMessagingKeyLatestNonceError };
		}

		if (resolvedAddress.type === 'vended') {
			return { error: new MessagingKeyNotRegisteredError() };
		}

		const privateMessagingKey = keyRing.addressExportableMessagingKey(
			resolvedAddress.protocolAddress,
			resolvedAddress.protocol,
			getMessagingKeyLatestNonce,
		);

		if (!isEqual(privateMessagingKey.publicKey, resolvedAddress.messagingKey)) {
			return { error: new SenderMessagingKeyIncorrect() };
		}

		return { data: privateMessagingKey };
	}
}
