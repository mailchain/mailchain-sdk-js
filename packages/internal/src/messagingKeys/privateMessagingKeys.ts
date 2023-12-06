import { PrivateKey, isPublicKeyEqual } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import { ProvidedMessagingKeyIncorrectError } from '@mailchain/signatures';
import { MailchainResult } from '..';
import { Configuration } from '../configuration';
import { AddressNonce, GetMessagingKeyLatestNonceError } from './addressNonce';
import { MessagingKeys, ResolveAddressError } from './messagingKeys';
import { AddressNotRegisteredError, GroupAddressNotSupportedError } from './errors';

export type GetExportablePrivateMessagingKeyError =
	| ResolveAddressError
	| GetMessagingKeyLatestNonceError
	| ProvidedMessagingKeyIncorrectError
	| AddressNotRegisteredError
	| GroupAddressNotSupportedError;

export class PrivateMessagingKeys {
	constructor(private readonly messagingKeys: MessagingKeys, private readonly addressNonce: AddressNonce) {}

	static create(config: Configuration) {
		return new PrivateMessagingKeys(MessagingKeys.create(config), AddressNonce.create(config));
	}

	async getExportablePrivateMessagingKey(
		address: string,
		keyRing: KeyRing,
	): Promise<MailchainResult<PrivateKey, GetExportablePrivateMessagingKeyError>> {
		const { data: resolvedAddress, error: resolveAddressError } = await this.messagingKeys.resolveIndividual(
			address,
		);

		if (resolveAddressError != null) {
			return { error: resolveAddressError };
		}

		if (resolvedAddress.type === 'vended') {
			return { error: new AddressNotRegisteredError() };
		}

		const { data: getMessagingKeyLatestNonce, error: getMessagingKeyLatestNonceError } =
			await this.addressNonce.getMessagingKeyLatestNonce(
				resolvedAddress.protocolAddress,
				resolvedAddress.protocol,
			);

		if (getMessagingKeyLatestNonceError != null) {
			return { error: getMessagingKeyLatestNonceError };
		}

		const privateMessagingKey = keyRing.addressExportableMessagingKey(
			resolvedAddress.protocolAddress,
			resolvedAddress.protocol,
			getMessagingKeyLatestNonce,
		);

		if (!isPublicKeyEqual(privateMessagingKey.publicKey, resolvedAddress.messagingKey)) {
			return { error: new ProvidedMessagingKeyIncorrectError('address') };
		}

		return { data: privateMessagingKey };
	}
}
