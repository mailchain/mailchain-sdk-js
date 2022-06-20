import { DecodeBase64 } from '@mailchain/encoding';
import { DecodePrivateKey, DecodePublicKey } from '@mailchain/crypto/multikey/encoding';
import axios from 'axios';
import { EncodeUtf8 } from '@mailchain/encoding/utf8';
import { ED25519ExtendedPrivateKey } from '@mailchain/crypto/ed25519';
import { KeyRingDecrypter } from '@mailchain/keyring/address';

import { protocol } from '../protobuf/protocol/protocol';
import { Configuration } from '../api/configuration';
import { TransportApiFactory } from '../api/api';
import { getAxiosWithSigner } from '../auth/jwt';
import { decryptPayload } from './content/decrypt';
import { Deserialize } from './content/serialization';

export class Receiver {
	constructor(private readonly configuration: Configuration) {}

	async getUndeliveredMessages(messagingKey: KeyRingDecrypter) {
		const transportApi = TransportApiFactory(this.configuration, undefined, getAxiosWithSigner(messagingKey));
		return transportApi.getDeliveryRequests().then(({ data: { deliveryRequests } }) => {
			return Promise.all(
				deliveryRequests.map((dr) =>
					processDeliveryRequest(messagingKey, protocol.Delivery.decode(DecodeBase64(dr.data)), dr.hash),
				),
			);
		});
	}
}

async function processDeliveryRequest(
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
		ED25519ExtendedPrivateKey.FromPrivateKey(DecodePrivateKey(payloadRootEncryptionKey)),
	);

	return {
		payload: decryptedPayload,
		hash,
	};
}
