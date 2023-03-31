import { PublicKey } from '@mailchain/crypto';
import isEqual from 'lodash/isEqual';
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
	 * @returns
	 */
	async verifySenderOwnsFromAddress(fromAddress: MailAddress, senderMessagingKey: PublicKey): Promise<boolean> {
		const { data: resolvedSenderMessagingKey, error } = await this.messagingKeys.resolve(fromAddress.address);
		if (error != null) {
			return false;
		}

		return isEqual(resolvedSenderMessagingKey.messagingKey, senderMessagingKey);
	}
}
