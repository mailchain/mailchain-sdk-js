import { ED25519ExtendedPrivateKey, ED25519PrivateKey, SignerWithPublicKey } from '@mailchain/crypto';
import { Configuration, TransportApiInterface, TransportApiFactory, getAxiosWithSigner } from '@mailchain/api';
import { MailchainResult } from '../..';
import { UnexpectedMailchainError } from '../../errors';
import { Payload, serializeAndEncryptPayload } from '../../transport';

export type SentPayload = {
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export type PreparePayloadParams = {
	payload: Payload;
};

export class PayloadSender {
	constructor(private readonly transportApi: TransportApiInterface) {}

	static create(configuration: Configuration, accountKeySigner: SignerWithPublicKey) {
		return new PayloadSender(TransportApiFactory(configuration, undefined, getAxiosWithSigner(accountKeySigner)));
	}

	/**
	 * Encrypt the payload with ephemeral key and deliver it to the storage nodes.
	 * @returns the URL to get the message from the and ephemeral key used for the encryption of it
	 */
	async sendPayload(payload: Payload): Promise<MailchainResult<SentPayload, UnexpectedMailchainError>> {
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
				error: new UnexpectedMailchainError('failed to send payload', error as Error),
			};
		}
	}
}
