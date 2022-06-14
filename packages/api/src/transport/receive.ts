import { KeyRing } from '@mailchain/keyring';
import { DecodeBase64 } from '@mailchain/encoding';
import { DecodePrivateKey, DecodePublicKey } from '@mailchain/crypto/multikey/encoding';
import axios from 'axios';
import { EncodeUtf8 } from '@mailchain/encoding/utf8';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { protocol } from '../protobuf/protocol/protocol';
import { Configuration } from '../api/configuration';
import { TransportApiFactory } from '../api';
import { decryptPayload } from './content/decrypt';
import { Deserialize } from './content/serialization';
import { Payload } from './content/payload';
import { getAxiosWithSigner } from '../auth/jwt';

export class Receiver {
	constructor(private readonly configuration: Configuration, private readonly keyRing: KeyRing) {}

	async pullNewMessages() {
		const transportApi = TransportApiFactory(
			this.configuration,
			undefined,
			getAxiosWithSigner(this.keyRing.accountMessagingKey()),
		);
		return transportApi.getDeliveryRequests().then(({ data: { deliveryRequests } }) => {
			return Promise.all(
				deliveryRequests.map((dr) =>
					processDeliveryRequest(this.keyRing, protocol.Delivery.decode(DecodeBase64(dr.data ?? ''))),
				),
			);
		});
	}
}

async function processDeliveryRequest(keyRing: KeyRing, incomingDeliveryRequest: protocol.Delivery) {
	const envelope = incomingDeliveryRequest.envelope!;
	if (!envelope.ecdhKeyBundle) {
		throw new Error('envelope does not contain ECDH key bundle');
	}

	const bundle = envelope.ecdhKeyBundle as protocol.ECDHKeyBundle;
	const decryptFn = await keyRing.accountMessagingKeyECDHDecrypter(
		DecodePublicKey(bundle.publicEphemeralKey),
		DecodePublicKey(bundle.publicMessagingKey),
	);

	const payloadRootEncryptionKey = await decryptFn(envelope.encryptedMessageKey!);

	if (payloadRootEncryptionKey.length === 0) {
		throw new Error('payloadRootEncryptionKey is empty');
	}

	const messageUri = await decryptFn(envelope.encryptedMessageUri!);
	let url = EncodeUtf8(messageUri);
	if (url.startsWith(':8080')) {
		// Temporary fix for messages
		url = `http://localhost${url.replace('8080/', '8080/transport/payloads/')}`;
	}

	const encryptedMessageBodyResponse = await axios.get(url, {
		responseType: 'json',
	});

	const encryptedMessageBody = Buffer.from(encryptedMessageBodyResponse.data, 'binary');
	const encryptedPayload = Deserialize(encryptedMessageBody);
	const decryptedPayload = await decryptPayload(
		encryptedPayload,
		ED25519ExtendedPrivateKey.FromPrivateKey(DecodePrivateKey(payloadRootEncryptionKey)),
	);

	return decryptedPayload;
}
