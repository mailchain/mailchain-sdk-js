import { KeyRing } from '@mailchain/keyring';
import { protocols } from '@mailchain/internal';
import { decodeAddressByProtocol } from '@mailchain/internal/addressing';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { MailSender, PrepareResult, SendResult } from './internal/transport/mail/send';
import { Lookup } from './internal/identityKeys';
import { MailchainUserProfile, UserProfile } from './internal/user';
import { toUint8Array } from './internal/formatters/hex';
import { Mailbox, MailchainMailbox } from './internal/mailbox';
import { Address, SendMailParams } from './types';
import { toMailData } from './convertSendMailParams';

export type Configuration = {
	apiPath: string;
};

const defaultConfiguration = { apiPath: 'https:/api.mailchain.com' };

export type SendMailResult2 = SendResult | PrepareResult;

export type SendMailResult = {
	messageID: string;
} & SendMailResult2;

export class Mailchain {
	private readonly _userProfile: UserProfile;
	private readonly _mailbox: Mailbox;
	constructor(private readonly keyRing: KeyRing, private readonly config: Configuration) {
		this._userProfile = MailchainUserProfile.create(
			config,
			keyRing.accountIdentityKey(),
			keyRing.userProfileCrypto(),
		);

		this._mailbox = MailchainMailbox.create(config, keyRing);
	}

	static fromAccountSeed(seed: Uint8Array | string, config: Configuration = defaultConfiguration) {
		const identityKey = ED25519PrivateKey.fromSeed(toUint8Array(seed));
		const keyRing = KeyRing.fromPrivateKey(identityKey);

		return Mailchain.fromKeyRing(keyRing, config);
	}

	static fromMnemonicPhrase(mnemonic: string, password?: string, config: Configuration = defaultConfiguration) {
		const keyRing = KeyRing.fromMnemonic(mnemonic, password);

		return Mailchain.fromKeyRing(keyRing, config);
	}

	static fromKeyRing(keyRing: KeyRing, config: Configuration = defaultConfiguration) {
		return new this(keyRing, config);
	}

	/**
	 * Send a mail to any blockchain address
	 * @param params {@link SendMailParams} message to send
	 * @returns
	 */
	async sendMail(params: SendMailParams): Promise<SendMailResult> {
		const senderMessagingKey = await this.getSenderMessagingKey(params.from, {
			lookup: Lookup.create(this.config),
			userProfile: MailchainUserProfile.create(
				this.config,
				this.keyRing.accountIdentityKey(),
				this.keyRing.userProfileCrypto(),
			),
		});

		const sender = MailSender.create(this.config, senderMessagingKey);

		// prepare message
		const mailData = toMailData(params);

		const prepareResult = await sender.prepare({
			message: mailData,
			senderMessagingKey,
		});

		if (prepareResult.status === 'failed-resolve-recipients') {
			throw Error('TODO:');
		}

		// save the message in the outbox while the sending is happening
		const outboxMessage = await this._mailbox.saveSentMessage({
			payload: prepareResult.message,
			content: mailData,
		});

		const sendResult = await sender.send({
			distributions: prepareResult.distributions,
			resolvedRecipients: prepareResult.resolvedRecipients,
		});

		// update folder
		switch (sendResult.status) {
			case 'success':
				await this._mailbox.markOutboxMessageAsSent(outboxMessage.messageId);
				break;

			case 'partially-completed':
				// leave in outbox
				break;
		}
		return {
			messageID: outboxMessage.messageId,
			...sendResult,
		};
	}

	async self() {
		return this._userProfile.getUsername();
	}

	private async getSenderMessagingKey(fromAddress: Address, config: { lookup: Lookup; userProfile: UserProfile }) {
		const fromPublicKey = await config.lookup.messageKey(fromAddress);
		if (fromPublicKey.address.protocol === protocols.MAILCHAIN) {
			return this.keyRing.accountMessagingKey();
		}

		const registeredAddresses = await config.userProfile.addresses();

		const foundRegisteredAddress = registeredAddresses.find((x) => {
			// comparing raw address is case sensitive
			return x.address === fromPublicKey.address.value && x.protocol === fromPublicKey.address.protocol;
		});

		if (!foundRegisteredAddress) {
			throw Error(`${fromAddress} is not registered by this account`);
		}

		return this.keyRing.addressMessagingKey(
			decodeAddressByProtocol(foundRegisteredAddress.address, foundRegisteredAddress.protocol).decoded,
			foundRegisteredAddress.protocol,
			foundRegisteredAddress.nonce,
		);
	}
}

export class FailedToSaveError extends Error {
	constructor(cause: Error) {
		super(`failed to save sent message`, { cause });
	}
}
