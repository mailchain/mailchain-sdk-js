import { Payload } from '@mailchain/internal/transport';
import { KeyRing } from '@mailchain/keyring';
import { PayloadHeaders } from '../transport/payload/headers';
import { Configuration } from '../configuration';
import { type PayloadStorage } from './payloadStorage';
import { MailchainPayloadStorage } from './payloadStorage/mailchainPayloadStorage';

/**
 * Coordinate the storage of payloads across multiple storage implementations.
 */
export class MailboxStorage {
	constructor(private readonly payloadStorages: [PayloadStorage, ...PayloadStorage[]]) {
		if (payloadStorages.length === 0) {
			throw new Error('at least one payload storage must be provided');
		}
	}

	static create(sdkConfig: Configuration, keyRing: KeyRing) {
		return new MailboxStorage([MailchainPayloadStorage.create(sdkConfig, keyRing)]);
	}

	/**
	 * Use the first storage that can store the payload to store it.
	 *
	 * @throws {Error} if no storage is able to store the payload.
	 */
	async storePayload(payload: Payload<PayloadHeaders>): Promise<string> {
		for (const payloadStorage of this.payloadStorages) {
			if (await payloadStorage.canStorePayload(payload)) {
				return await payloadStorage.storePayload(payload);
			}
		}

		throw new Error(`no storage able to handle storing of payload for: ${payload}`);
	}

	/**
	 * Use the first storage that can get the payload to get it.
	 *
	 * @throws {Error} if no storage is able to get the payload.
	 */
	async getPayload(messageId: string, resourceId: string): Promise<Payload> {
		for (const payloadStorage of this.payloadStorages) {
			if (await payloadStorage.canGetPayload(messageId, resourceId)) {
				return await payloadStorage.getPayload(messageId, resourceId);
			}
		}

		throw new Error(`no storage able to handle getting of payload for: ${messageId} ${resourceId}`);
	}
}
