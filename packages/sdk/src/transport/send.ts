import { RandomFunction, secureRandom } from '@mailchain/crypto';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase64, EncodeHexZeroX } from '@mailchain/encoding';
import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { KeyRing } from '@mailchain/keyring';
import { protocol } from '../protobuf/protocol/protocol';
import { Configuration, PublicKey, TransportApi, TransportApiFactory } from '../api';
import { getPublicKeyFromApiResponse, Lookup } from '../identityKeys';
import { getAxiosWithSigner } from '../auth/jwt';
import { MailAddress } from '../formatters/types';
import { LookupResult } from '../identityKeys/lookup';
import { CHUNK_LENGTH_1MB } from './content/chunk';
import { encryptPayload } from './content/encrypt';
import { Payload } from './content/payload';
import { Serialize } from './content/serialization';
import { createDelivery } from './delivery/delivery';

type SuccessPayloadRecipientDelivery = {
	status: 'success';
	deliveryRequestId: string;
	recipient: PublicKey;
};

type FailPayloadRecipientDelivery = {
	status: 'fail';
	cause: Error;
	recipient: PublicKey;
};

export type PayloadRecipientDelivery = SuccessPayloadRecipientDelivery | FailPayloadRecipientDelivery;
export type PayloadForRecipient = { recipient: MailAddress; payload: Payload };
export type LookupMessageResolver = (address: string) => Promise<LookupResult>;

export class Sender {
	constructor(
		private readonly transportApi: TransportApi,

		private readonly lookupMessageResolver: LookupMessageResolver,
		private readonly rand: RandomFunction = secureRandom,
	) {}
	/**
	 * Sends a message to multiple recipients
	 */
	sendPayloadInternal = async ({ payload, recipient }: PayloadForRecipient): Promise<PayloadRecipientDelivery> => {
		const { messageKey } = await this.lookupMessageResolver(recipient.address);
		const encodedDelivery = await this.prepare(messageKey, payload, this.rand);
		return this.sendToRecipient(messageKey, encodedDelivery);
	};
	static create(configuration: Configuration, keyRing: KeyRing) {
		return new Sender(
			TransportApiFactory(
				configuration,
				undefined,
				getAxiosWithSigner(keyRing.accountIdentityKey()),
			) as TransportApi,
			(address: string) => Lookup.create(configuration).messageKey(address),
		);
	}

	sendPayload(payloads: PayloadForRecipient[]): Promise<PayloadRecipientDelivery[]> {
		return Promise.all(payloads.map(this.sendPayloadInternal));
	}

	private async prepare(recipientMessageKey: PublicKey, payload: Payload, rand: RandomFunction): Promise<Uint8Array> {
		// create root encryption key that will be used to encrypt message content.
		const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(ED25519PrivateKey.generate(rand));

		const encryptedPayload = await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB, rand);
		const serializedContent = Serialize(encryptedPayload);

		const { uri: messageUri } = await this.transportApi.postEncryptedPayload(serializedContent).then((r) => r.data);

		const deliveryCreated = await createDelivery(
			getPublicKeyFromApiResponse(recipientMessageKey),
			payloadRootEncryptionKey,
			messageUri,
			rand,
		);
		return protocol.Delivery.encode(deliveryCreated).finish();
	}

	private async sendToRecipient(
		messageKey: PublicKey,
		encodedDelivery: Uint8Array,
	): Promise<PayloadRecipientDelivery> {
		try {
			const res = await this.transportApi.postDeliveryRequest({
				encryptedDeliveryRequest: EncodeBase64(encodedDelivery),
				recipientMessagingKey: EncodeHexZeroX(EncodePublicKey(getPublicKeyFromApiResponse(messageKey))),
			});
			return {
				status: 'success',
				recipient: messageKey,
				deliveryRequestId: res.data.deliveryRequestID,
			};
		} catch (e) {
			return {
				status: 'fail',
				cause: e as Error,
				recipient: messageKey,
			};
		}
	}
}
