import { encodeHex } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { KeyRingDecrypter } from '@mailchain/keyring/functions';
import axios, { AxiosInstance } from 'axios';
import { MailReceiver } from '../receiving/mail';
import { Configuration } from '..';
import { MailboxOperations, MessagePreview } from '../mailbox';
import { UserMailbox } from '../user/types';

type SyncResultOk = {
	status: 'success';
	mailbox: UserMailbox;
	messages: MessagePreview[];
};

type SyncResultFailed = {
	status: 'fail';
	mailbox: UserMailbox;
	cause: Error;
};

export type SyncResult = SyncResultOk | SyncResultFailed;

export class MessageSync {
	constructor(
		private readonly sdkConfig: Configuration,
		private readonly receiverFactory: (typeof MailReceiver)['create'],
		private readonly keyRing: KeyRing,
		private readonly mailboxOperations: MailboxOperations,
		private readonly axiosInstance: AxiosInstance = axios.create(),
	) {}

	static create(
		sdkConfig: Configuration,
		keyRing: KeyRing,
		mailboxOperations: MailboxOperations,
		axiosInstance: AxiosInstance = axios.create(),
	) {
		return new MessageSync(sdkConfig, MailReceiver.create, keyRing, mailboxOperations, axiosInstance);
	}

	async sync(mailboxes: UserMailbox[]): Promise<SyncResult[]> {
		return Promise.all<SyncResult>(
			mailboxes.map((mailbox) =>
				this.syncMailbox(mailbox).catch((cause: Error) => ({ status: 'fail', mailbox, cause })),
			),
		);
	}

	private async syncMailbox(mailbox: UserMailbox): Promise<SyncResult> {
		const messagingKey = this.keyRing.addressBytesMessagingKey(
			mailbox.messagingKeyParams.address,
			mailbox.messagingKeyParams.protocol,
			mailbox.messagingKeyParams.nonce,
		);
		return this.syncWithMessagingKey(mailbox, messagingKey);
	}

	async syncWithMessagingKey(mailbox: UserMailbox, messagingKey: KeyRingDecrypter): Promise<SyncResult> {
		const receiver = this.receiverFactory(this.sdkConfig, messagingKey, this.axiosInstance);

		const undeliveredMessages = await receiver.getUndelivered();

		const messages: MessagePreview[] = [];
		for (const undeliveredMessage of undeliveredMessages) {
			if (undeliveredMessage.status !== 'success') {
				console.warn('failed to get undelivered message', undeliveredMessage.cause);
				continue;
			}

			const savedMessages = await this.mailboxOperations
				.saveReceivedMessage({ receivedTransportPayload: undeliveredMessage.payload, userMailbox: mailbox })
				.catch((e) => {
					console.warn(
						`Failed saving received message with hash ${encodeHex(undeliveredMessage.deliveryRequestHash)}`,
						e,
					);
					return undefined;
				});

			if (savedMessages && savedMessages.length > 0) {
				messages.push(...savedMessages);
				await receiver
					.confirmDelivery(undeliveredMessage.deliveryRequestHash)
					.then(() => {
						console.debug(
							`Successfully confirmed delivery message hash ${encodeHex(
								undeliveredMessage.deliveryRequestHash,
							)}`,
						);
					})
					.catch((e) =>
						console.warn(
							`Failed saving received message with hash ${encodeHex(
								undeliveredMessage.deliveryRequestHash,
							)}`,
							e,
						),
					);
			}
		}
		return { status: 'success', mailbox, messages };
	}
}
