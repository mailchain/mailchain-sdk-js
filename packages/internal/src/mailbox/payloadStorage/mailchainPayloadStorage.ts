import { Payload } from '@mailchain/internal/transport';
import { PayloadHeaders } from '@mailchain/internal/transport/payload/headers';
import { InboxApiFactory, InboxApiInterface, createAxiosConfiguration, getAxiosWithSigner } from '@mailchain/api';
import { isHex } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { Configuration } from '../../configuration';
import { MessageCrypto, createMailchainMessageCrypto } from '../messageCrypto';
import { PayloadStorage } from './payloadStorage';

/**
 * MailchainPayloadStorage implements PayloadStorage using the Mailchain API.
 * The stored payloads are encrypted using keys from the account keyring.
 */
export class MailchainPayloadStorage implements PayloadStorage {
	constructor(private readonly messageCrypto: MessageCrypto, private readonly inboxApi: InboxApiInterface) {}

	static create(sdkConfig: Configuration, keyRing: KeyRing): PayloadStorage {
		const axiosConfig = createAxiosConfiguration(sdkConfig.apiPath);
		const axiosClient = getAxiosWithSigner(keyRing.accountMessagingKey());
		const inboxApi = InboxApiFactory(axiosConfig, undefined, axiosClient);

		const messageCrypto = createMailchainMessageCrypto(keyRing);

		return new MailchainPayloadStorage(messageCrypto, inboxApi);
	}

	async canStorePayload(_payload: Payload<PayloadHeaders>): Promise<boolean> {
		return true;
	}

	async storePayload(payload: Payload<PayloadHeaders>): Promise<string> {
		const encryptedPayload = await this.messageCrypto.encrypt(payload);
		const { resourceId } = await this.inboxApi.postEncryptedMessageBody(encryptedPayload).then((res) => res.data);

		return resourceId;
	}

	canGetPayload(messageId: string, _resourceId: string): Promise<boolean> {
		// messageId: 5ae729180870ee175559d5068789d530cb5dc9db5aaa3f9dfdc0c6460aa1d129
		return Promise.resolve(isHex(messageId));
	}

	async getPayload(messageId: string, _resourceId: string): Promise<Payload<PayloadHeaders>> {
		const encryptedMessage = await this.inboxApi
			.getEncryptedMessageBody(messageId, { responseType: 'arraybuffer' })
			.then((res) => res.data as ArrayBuffer);

		return await this.messageCrypto.decrypt(new Uint8Array(encryptedMessage));
	}
}
