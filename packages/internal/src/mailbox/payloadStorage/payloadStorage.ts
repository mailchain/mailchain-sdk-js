import { Payload } from '../../transport';

export interface PayloadStorage {
	/**
	 * Check if the payload can be stored in the context of the storage.
	 * This check does not guarantee that the payload will be stored.
	 */
	canStorePayload(payload: Payload): Promise<boolean>;

	/**
	 * @param payload The payload to store.
	 * @returns The resource identifier under which the payload is stored.
	 */
	storePayload(payload: Payload): Promise<string>;

	/**
	 * Check if the resource identifier is valid in the context of the storage.
	 * This check does not guarantee that the payload is retrievable nor that it exists.
	 *
	 * @param resourceId The resource identifier under which the payload is stored.
	 * @returns true if the resource identifier is valid.
	 */
	canGetPayload(messageId: string, resourceId: string): Promise<boolean>;

	/**
	 * @param resourceId The resource identifier under which the payload is stored.
	 * @returns The payload.
	 * @throws Error if the payload is not found or cannot be retrieved.
	 */
	getPayload(messageId: string, resourceId: string): Promise<Payload>;
}
