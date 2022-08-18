import { decodeBase64, encodeUtf8 } from '@mailchain/encoding';
import { ED25519ExtendedPrivateKey, decodePrivateKey, decodePublicKey } from '@mailchain/crypto';
import { KeyRingDecrypter } from '@mailchain/keyring';
import axios from 'axios';
import { protocol } from '../protobuf/protocol/protocol';
import { TransportApiFactory, TransportApiInterface } from '../api';
import { getAxiosWithSigner } from '../auth/jwt';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';
import { Payload } from './payload/content/payload';
import { decryptPayload } from './payload/content/decrypt';
import { deserialize } from './payload/content/serialization';

export class Receiver {
	constructor(
		private readonly transportApi: TransportApiInterface,
		private readonly messagingKey: KeyRingDecrypter,
	) {}

	static create(configuration: Configuration, messagingKeyDecrypter: KeyRingDecrypter) {
		return new Receiver(
			TransportApiFactory(
				createAxiosConfiguration(configuration),
				undefined,
				getAxiosWithSigner(messagingKeyDecrypter),
			),
			messagingKeyDecrypter,
		);
	}

	async getUndeliveredMessages(): Promise<
		PromiseSettledResult<{
			payload: Payload;
			hash: string;
		}>[]
	> {
		return this.transportApi.getDeliveryRequests().then(({ data: { deliveryRequests } }) => {
			return Promise.allSettled(
				deliveryRequests.map((dr) => {
					const delivery = protocol.Delivery.decode(decodeBase64(dr.data));
					return this.processDeliveryRequest(this.messagingKey, delivery, dr.hash);
				}),
			);
		});
	}

	private async processDeliveryRequest(messagingKey: KeyRingDecrypter, delivery: protocol.Delivery, hash: string) {
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

		const payloadRootEncryptionKey = await messagingKey.ecdhDecrypt(
			decodePublicKey(ecdhKeyBundle.publicEphemeralKey),
			encryptedMessageKey,
		);

		if (payloadRootEncryptionKey.length === 0) {
			throw new Error('payloadRootEncryptionKey is empty');
		}

		const messageUri = await messagingKey.ecdhDecrypt(
			decodePublicKey(ecdhKeyBundle.publicEphemeralKey),
			encryptedMessageUri,
		);
		const url = encodeUtf8(messageUri);

		const encryptedMessageBodyResponse = await axios.get(url, {
			responseType: 'arraybuffer',
		});

		const encryptedMessageBody = Buffer.from(decodeBase64(encryptedMessageBodyResponse.data));

		const encryptedPayload = deserialize(encryptedMessageBody);
		const decryptedPayload = await decryptPayload(
			encryptedPayload,
			ED25519ExtendedPrivateKey.fromPrivateKey(decodePrivateKey(payloadRootEncryptionKey)),
		);

		return { payload: decryptedPayload, hash };
	}
}
