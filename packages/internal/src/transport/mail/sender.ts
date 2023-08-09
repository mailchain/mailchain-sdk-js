import { PublicKey, isPublicKeyEqual } from '@mailchain/crypto';
import { Configuration } from '../../configuration';
import { MessagingKeys } from '../../messagingKeys';
import { MailAddress } from './types';

export class MailSenderVerifier {
	constructor(private readonly messagingKeys: MessagingKeys) {}

	static create(configuration: Configuration) {
		return new MailSenderVerifier(MessagingKeys.create(configuration));
	}
	/**
	 *
	 * @param fromAddress address that sent the mail. `From:` header in the mail.
	 * @param senderMessagingKey public key of the sender.
	 * @param at Date to resolve the sender messaging key. When no date is provided, the address resolves using the latest block.
	 * @returns
	 */
	async verifySenderOwnsFromAddress(
		fromAddress: MailAddress,
		senderMessagingKey: PublicKey,
		at?: Date,
	): Promise<boolean> {
		const { data: resolvedSenderMessagingKey, error } = await this.messagingKeys.resolve(fromAddress.address, at);
		if (error != null) {
			return false;
		}

		return isPublicKeyEqual(resolvedSenderMessagingKey.messagingKey, senderMessagingKey);
	}
}
