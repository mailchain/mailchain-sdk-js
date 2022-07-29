import { DecodeBase64 } from '@mailchain/encoding';
import { DecodePrivateKey, DecodePublicKey } from '@mailchain/crypto/multikey/encoding';
import axios from 'axios';
import { EncodeUtf8 } from '@mailchain/encoding/utf8';
import { ED25519ExtendedPrivateKey } from '@mailchain/crypto/ed25519';
import { KeyRingDecrypter } from '@mailchain/keyring/functions';
import { protocol } from '../protobuf/protocol/protocol';
import { Configuration } from '../api/configuration';
import { TransportApiFactory, TransportApi } from '../api/api';
import { getAxiosWithSigner } from '../auth/jwt';
import { decryptPayload } from './payload/content/decrypt';
import { Deserialize } from './payload/content/serialization';

export class Receiver {
	constructor(private readonly transportApi: TransportApi, private readonly messagingKey: KeyRingDecrypter) {}
	getUndeliveredMessages = async () => {
		return this.transportApi.getDeliveryRequests().then(({ data: { deliveryRequests } }) => {
			return Promise.allSettled(
				deliveryRequests.map((dr) =>
					this.processDeliveryRequest(
						this.messagingKey,
						protocol.Delivery.decode(DecodeBase64(dr.data)),
						dr.hash,
					),
				),
			);
		});
	};

	static create(configuration: Configuration, messagingKeyDecrypter: KeyRingDecrypter) {
		return new Receiver(
			TransportApiFactory(configuration, undefined, getAxiosWithSigner(messagingKeyDecrypter)) as TransportApi,
			messagingKeyDecrypter,
		);
	}

	private async processDeliveryRequest(
		messagingKey: KeyRingDecrypter,
		incomingDeliveryRequest: protocol.Delivery,
		hash: string,
	) {
		const envelope = incomingDeliveryRequest.envelope!;
		if (!envelope.ecdhKeyBundle) {
			throw new Error('envelope does not contain ECDH key bundle');
		}

		const bundle = envelope.ecdhKeyBundle as protocol.ECDHKeyBundle;

		const payloadRootEncryptionKey = await messagingKey.ecdhDecrypt(
			DecodePublicKey(bundle.publicEphemeralKey),
			envelope.encryptedMessageKey!,
		);

		if (payloadRootEncryptionKey.length === 0) {
			throw new Error('payloadRootEncryptionKey is empty');
		}

		const messageUri = await messagingKey.ecdhDecrypt(
			DecodePublicKey(bundle.publicEphemeralKey),
			envelope.encryptedMessageUri!,
		);
		const url = EncodeUtf8(messageUri);

		const encryptedMessageBodyResponse = await axios.get(url, {
			responseType: 'arraybuffer',
		});

		const encryptedMessageBody = Buffer.from(DecodeBase64(encryptedMessageBodyResponse.data));

		const encryptedPayload = Deserialize(encryptedMessageBody);
		const decryptedPayload = await decryptPayload(
			encryptedPayload,
			ED25519ExtendedPrivateKey.fromPrivateKey(DecodePrivateKey(payloadRootEncryptionKey)),
		);

		return {
			payload: decryptedPayload,
			hash,
		};
	}
}
