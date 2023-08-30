import { ED25519ExtendedPrivateKey, ED25519PrivateKey, SignerWithPublicKey } from '@mailchain/crypto';
import {
	TransportApiInterface,
	TransportApiFactory,
	getAxiosWithSigner,
	createAxiosConfiguration,
} from '@mailchain/api';
import { Configuration, MailchainResult } from '../..';
import { Payload, serializeAndEncryptPayload } from '../../transport';

export type StoredPayload = {
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export type PreparePayloadParams = {
	payload: Payload;
};

export class StorePayloadError extends Error {
	constructor(cause: Error) {
		super('Payload could not be stored.', { cause });
	}
}

export class PayloadStorer {
	constructor(private readonly transportApi: TransportApiInterface) {}

	static create(configuration: Configuration, accountKeySigner: SignerWithPublicKey) {
		return new PayloadStorer(
			TransportApiFactory(
				createAxiosConfiguration(configuration.apiPath),
				undefined,
				getAxiosWithSigner(accountKeySigner),
			),
		);
	}

	/**
	 * Encrypt the payload with ephemeral key and deliver it to the storage nodes.
	 * @returns the URL to get the message from the and ephemeral key used for the encryption of it
	 */
	async storePayload(payload: Payload): Promise<MailchainResult<StoredPayload, StorePayloadError>> {
		try {
			// create root encryption key that will be used to encrypt message content.
			const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(ED25519PrivateKey.generate());
			const serializedContent = await serializeAndEncryptPayload(payload, payloadRootEncryptionKey);
			const { uri: payloadUri } = await this.transportApi
				.postEncryptedPayload(serializedContent)
				.then((r) => r.data);

			return {
				data: {
					payloadUri,
					payloadRootEncryptionKey,
				},
			};
		} catch (error) {
			return {
				error: new StorePayloadError(error as Error),
			};
		}
	}
}
