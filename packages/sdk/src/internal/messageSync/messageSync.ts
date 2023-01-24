import { KeyRing } from '@mailchain/keyring';
import { KeyRingDecrypter } from '@mailchain/keyring/functions';
import { Configuration } from '../..';
import { MailboxOperations, MessagePreview } from '../mailbox';
import { MailReceiver } from '../receiving/mail';
import { UserMailbox } from '../user/types';

type SuccessSyncResult = {
	type: 'success';
	mailbox: UserMailbox;
	messages: MessagePreview[];
};

type FailedSyncResult = {
	type: 'fail';
	mailbox: UserMailbox;
	cause: Error;
};

export type SyncResult = SuccessSyncResult | FailedSyncResult;

export class MessageSync {
	constructor(
		private readonly sdkConfig: Configuration,
		private readonly receiverFactory: (typeof MailReceiver)['create'],
		private readonly keyRing: KeyRing,
		private readonly mailboxOperations: MailboxOperations,
	) {}

	static create(sdkConfig: Configuration, keyRing: KeyRing, mailboxOperations: MailboxOperations) {
		return new MessageSync(sdkConfig, MailReceiver.create, keyRing, mailboxOperations);
	}

	async sync(mailboxes: UserMailbox[]): Promise<SyncResult[]> {
		return Promise.all<SyncResult>(
			mailboxes.map((mailbox) =>
				this.syncMailbox(mailbox).catch((cause: Error) => ({ type: 'fail', mailbox, cause })),
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
		const receiver = this.receiverFactory(this.sdkConfig, messagingKey);

		const messageResults = await receiver.getUndelivered();
		const messages: MessagePreview[] = [];
		for (const messageResult of messageResults) {
			if (messageResult.status !== 'ok') {
				console.warn('failed to get undelivered message', messageResult.cause);
				continue;
			}

			const savedMessages = await this.mailboxOperations
				.saveReceivedMessage({ payload: messageResult.payload, userMailbox: mailbox })
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
		return { type: 'success', mailbox, messages };
	}
}
