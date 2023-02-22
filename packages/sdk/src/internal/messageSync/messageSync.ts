import { KeyRing } from '@mailchain/keyring';
import { KeyRingDecrypter } from '@mailchain/keyring/functions';
import axios, { AxiosInstance } from 'axios';
import { Configuration } from '../..';
import { MailboxOperations, MessagePreview } from '../mailbox';
import { MailReceiver } from '../../receiving/mail';
import { UserMailbox } from '../user/types';

type SyncResultOk = {
	status: 'ok';
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
		const messagingKey = this.keyRing.addressMessagingKey(
			mailbox.messagingKeyParams.address,
			mailbox.messagingKeyParams.protocol,
			mailbox.messagingKeyParams.nonce,
		);
		return this.syncWithMessagingKey(mailbox, messagingKey);
	}

	async syncWithMessagingKey(mailbox: UserMailbox, messagingKey: KeyRingDecrypter): Promise<SyncResult> {
		const receiver = this.receiverFactory(this.sdkConfig, messagingKey, this.axiosInstance);

		const messageResults = await receiver.getUndelivered();
		const messages: MessagePreview[] = [];
		for (const messageResult of messageResults) {
			if (messageResult.status !== 'ok') {
				console.warn('failed to get undelivered message', messageResult.cause);
				continue;
			}

			const savedMessages = await this.mailboxOperations
				.saveReceivedMessage({ receivedTransportPayload: messageResult.payload, userMailbox: mailbox })
				.catch((e) => {
					console.warn(`Failed saving received message with hash ${messageResult.deliveryRequestHash}`, e);
					return undefined;
				});

			if (savedMessages && savedMessages.length > 0) {
				messages.push(...savedMessages);
				await receiver
					.confirmDelivery(messageResult.deliveryRequestHash)
					.then(() => {
						console.debug(
							`Successfully confirmed delivery message hash ${messageResult.deliveryRequestHash}`,
						);
					})
					.catch((e) =>
						console.warn(
							`Failed saving received message with hash ${messageResult.deliveryRequestHash}`,
							e,
						),
					);
			}
		}
		return { status: 'ok', mailbox, messages };
	}
}
