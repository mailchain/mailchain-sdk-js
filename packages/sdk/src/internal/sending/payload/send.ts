import { ED25519ExtendedPrivateKey, ED25519PrivateKey, SignerWithPublicKey, PublicKey } from '@mailchain/crypto';
import { Configuration, TransportApiInterface, TransportApiFactory, getAxiosWithSigner } from '@mailchain/api';
import { Payload, serializeAndEncryptPayload } from '../../transport';

export type PreparePayloadResult = {
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export type PreparePayloadParams = {
	payload: Payload;
};

export type SendPayloadParams = {
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
	recipients: PublicKey[];
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
	async prepare(payload: Payload): Promise<PreparePayloadResult> {
		// create root encryption key that will be used to encrypt message content.
		const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(ED25519PrivateKey.generate());

		const serializedContent = await serializeAndEncryptPayload(payload, payloadRootEncryptionKey);

		const { uri: payloadUri } = await this.transportApi.postEncryptedPayload(serializedContent).then((r) => r.data);

		return {
			payloadUri,
			payloadRootEncryptionKey,
		};
	}
}
