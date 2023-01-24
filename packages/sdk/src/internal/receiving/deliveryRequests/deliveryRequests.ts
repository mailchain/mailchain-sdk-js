import {
	createAxiosConfiguration,
	getAxiosWithSigner,
	TransportApiFactory,
	TransportApiInterface,
} from '@mailchain/api';
import { decodePrivateKey, decodePublicKey, ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { KeyRingDecrypter } from '@mailchain/keyring';
import { decodeBase64, decodeHexZeroX, encodeHexZeroX, encodeUtf8 } from '@mailchain/encoding';
import { signMailchainDeliveryConfirmation } from '@mailchain/signatures';
import { protocol } from '../../protobuf/protocol/protocol';
import { Configuration } from '../../../';

export type UndeliveredDeliveryRequestSuccess = {
	status: 'ok';
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
	payloadUri: string;
	hash: Uint8Array;
};

export type UndeliveredDeliveryRequestFailed = {
	status: 'error';
	cause: Error;
	hash: Uint8Array;
};

export type UndeliveredDeliveryRequest = UndeliveredDeliveryRequestSuccess | UndeliveredDeliveryRequestFailed;

export class DeliveryRequests {
	constructor(
		private readonly transportApi: TransportApiInterface,
		private readonly messagingKey: KeyRingDecrypter,
	) {}

	static create(configuration: Configuration, receiverMessagingKeyDecrypter: KeyRingDecrypter) {
		return new DeliveryRequests(
			TransportApiFactory(
				createAxiosConfiguration(configuration.apiPath),
				undefined,
				getAxiosWithSigner(receiverMessagingKeyDecrypter),
			),
			receiverMessagingKeyDecrypter,
		);
	}

	async confirmDelivery(hash: Uint8Array) {
		const signature = await signMailchainDeliveryConfirmation(this.messagingKey, hash);
		await this.transportApi.putDeliveryRequestConfirmation(encodeHexZeroX(hash), {
			signature: encodeHexZeroX(signature),
		});
	}

	async getUndelivered(): Promise<UndeliveredDeliveryRequest[]> {
		const processed = this.transportApi.getDeliveryRequests().then(({ data: { deliveryRequests } }) => {
			return Promise.all(
				deliveryRequests.map((dr) => {
					const delivery = protocol.Delivery.decode(decodeBase64(dr.data));
					return this.processDeliveryRequest(this.messagingKey, delivery, decodeHexZeroX(dr.hash));
				}),
			);
		});

		return processed;
	}

	private async processDeliveryRequest(
		messagingKey: KeyRingDecrypter,
		delivery: protocol.Delivery,
		hash: Uint8Array,
	): Promise<UndeliveredDeliveryRequest> {
		try {
			const { envelope } = delivery;
			if (!envelope) {
				throw new Error('envelope is undefined');
			}
			const { ecdhKeyBundle, encryptedMessageKey, encryptedMessageUri } = envelope;
			if (!ecdhKeyBundle) {
				throw new Error('envelope does not contain ECDH key bundle');
			}
			if (!encryptedMessageKey) {
				throw new Error('envelope does not contain encryptedMessageKey');
			}
			if (!encryptedMessageUri) {
				throw new Error('envelope does not contain encryptedMessageUri');
			}

			if (!ecdhKeyBundle.publicEphemeralKey) {
				throw new Error('ECDH key bundle does not contain publicEphemeralKey');
			}

			const payloadRootEncryptionKeyBytes = await messagingKey.ecdhDecrypt(
				decodePublicKey(ecdhKeyBundle.publicEphemeralKey),
				encryptedMessageKey,
			);

			if (payloadRootEncryptionKeyBytes.length === 0) {
				throw new Error('payloadRootEncryptionKey is empty');
			}

			const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(
				decodePrivateKey(payloadRootEncryptionKeyBytes),
			);

			const payloadUriBytes = await messagingKey.ecdhDecrypt(
				decodePublicKey(ecdhKeyBundle.publicEphemeralKey),
				encryptedMessageUri,
			);

			if (payloadUriBytes.length === 0) {
				throw new Error('payloadUri is empty');
			}

			const payloadUri = encodeUtf8(payloadUriBytes);

			return {
				status: 'ok',
				payloadRootEncryptionKey,
				payloadUri,
				hash,
			};
		} catch (error) {
			return {
				status: 'error',
				cause: error as Error,
				hash,
			};
		}
	}
}
