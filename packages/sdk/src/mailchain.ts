import { KeyRing } from '@mailchain/keyring';
import { ED25519PrivateKey, isPublicKeyEqual } from '@mailchain/crypto';
import { EncodingTypes, ensureDecoded } from '@mailchain/encoding';
import { MailSender, PrepareResult, SendResult } from './sending/mail';
import { MessagingKeys, FailedAddressMessageKeyResolutionsError } from './messagingKeys';
import { MailchainUserProfile, UserNotFoundError, UserProfile } from './internal/user';
import { MailboxOperations, MailchainMailboxOperations } from './internal/mailbox';
import { Address, SendMailParams } from './types';
import { toMailData } from './convertSendMailParams';
import { UserMailbox } from './internal/user/types';

export type Configuration = {
	apiPath: string;
	mailchainAddressDomain: string;
	nearRpcUrl: string;
};

const defaultConfiguration: Configuration = {
	apiPath: 'https://api.mailchain.com',
	mailchainAddressDomain: 'mailchain.com',
	nearRpcUrl: 'https://rpc.near.org',
};

type MailSenderResult = SendResult | PrepareResult;

export type SendMailResult = {
	messageID: string;
} & MailSenderResult;

export class Mailchain {
	private readonly _userProfile: UserProfile;
	private readonly _mailboxOperations: MailboxOperations;
	constructor(private readonly keyRing: KeyRing, private readonly config: Configuration) {
		this._userProfile = MailchainUserProfile.create(
			config,
			keyRing.accountIdentityKey(),
			keyRing.userProfileCrypto(),
		);

		this._mailboxOperations = MailchainMailboxOperations.create(config, keyRing);
	}

	static fromAccountSeed(seed: Uint8Array | string, config: Configuration = defaultConfiguration) {
		const identityKey = ED25519PrivateKey.fromSeed(ensureDecoded(seed, EncodingTypes.HexAny));
		const keyRing = KeyRing.fromPrivateKey(identityKey);

		return Mailchain.fromKeyRing(keyRing, config);
	}

	/**
	 * Use your Secret Recovery Phrase to authenticate with the SDK.
	 * You can get your Secret Recovery Phrases when registering an account or via the [settings page](https://app.mailchain.com/settings) in the application.
	 * @param secretRecoveryPhrase a 24 word [BIP 39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) compatible mnemonic phrase.
	 * @returns an authenticated {@link Mailchain} SDK. Use {@link Mailchain.user()} to get the currently authenticate used details
	 */
	static fromSecretRecoveryPhrase(
		secretRecoveryPhrase: string,
		password?: string,
		config: Configuration = defaultConfiguration,
	) {
		const keyRing = KeyRing.fromMnemonic(secretRecoveryPhrase, password);

		return Mailchain.fromKeyRing(keyRing, config);
	}

	/**
	 * @deprecated use {@link fromSecretRecoveryPhrase} instead.
	 */
	static fromMnemonicPhrase(mnemonic: string, password?: string, config: Configuration = defaultConfiguration) {
		return Mailchain.fromSecretRecoveryPhrase(mnemonic, password, config);
	}

	static fromKeyRing(keyRing: KeyRing, config: Configuration = defaultConfiguration) {
		return new this(keyRing, config);
	}

	/**
	 * Send a mail to any blockchain or Mailchain address.
	 *
	 * @param params {@link SendMailParams} Information about message to send.
	 * Required:
	 * - `from` the address that the mail is being sent from.
	 * - At least one of `to`, `cc`, or `bcc`, who will receive the mail.
	 * - `subject` of the mail.
	 * - `content` both `html` and `text`.
	 *
	 * @example
	 * import { Mailchain } from '@mailchain/sdk';
	 *
	 * const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE!; // 25 word mnemonicPhrase
	 *
	 * const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);
	 *
	 * const result = await mailchain.sendMail({
	 * 		from: `yoursername@mailchain.com`, // sender address
	 * 		to: [`0xbb56FbD7A2caC3e4C17936027102344127b7a112@ethereum.mailchain.com`], // list of recipients (blockchain or mailchain addresses)
	 * 		subject: 'My first message', // subject line
	 * 		content: {
	 * 			text: 'Hello Mailchain 👋', // plain text body
	 * 			html: '<p>Hello Mailchain 👋</p>', // html body
	 * 		},
	 * });
	 *
	 * console.log(result)
	 *
	 * @returns Status of the messaging sending request. {@link SendMailResult} contains different data
	 * depending on the status of the request.
	 */
	async sendMail(params: SendMailParams): Promise<SendMailResult> {
		const senderMailbox = await this.getSenderMailbox(params.from, {
			messagingKeys: MessagingKeys.create(this.config),
			userProfile: this._userProfile,
		});
		const senderMessagingKey = this.keyRing.addressMessagingKey(
			senderMailbox.messagingKeyParams.address,
			senderMailbox.messagingKeyParams.protocol,
			senderMailbox.messagingKeyParams.nonce,
		);

		const sender = MailSender.create(this.config, senderMessagingKey);

		// prepare message
		const mailData = toMailData(params);

		const prepareResult = await sender.prepare({
			message: mailData,
			senderMessagingKey,
		});

		if (prepareResult.status === 'failed-resolve-recipients') {
			throw new FailedAddressMessageKeyResolutionsError(prepareResult.failedRecipients);
		}

		// save the message in the outbox while the sending is happening
		const outboxMessage = await this._mailboxOperations.saveSentMessage({
			userMailbox: senderMailbox,
			payload: prepareResult.message,
			content: mailData,
		});

		const sendResult = await sender.send({
			distributions: prepareResult.distributions,
			resolvedAddresses: prepareResult.resolvedAddresses,
		});

		// update folder
		switch (sendResult.status) {
			case 'success':
				await this._mailboxOperations.markOutboxMessageAsSent(outboxMessage.messageId);
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

	/**
	 * Gets the username and mail address corresponding to the authenticated user.
	 *
	 * @throws a {@link UserNotFoundError} error if the mnemonic phrase or seed does not have a user registered.
	 * A user must be registered via {@link https://app.mailchain.com/register}.
	 * Check the mnemonic phrase or seed is correct.
	 *
	 * @returns a promise containing the username and the mail address of the logged in user.
	 *
	 * @example
	 *
	 * import { Mailchain } from "@mailchain/sdk";
	 *
	 * const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE!; // 25 word mnemonicPhrase
	 *
	 * const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);
	 *
	 * const user = await mailchain.user();
	 *
	 * console.log(`username: ${user.username}, address: ${user.address}`);
	 * // username: alice, address: alice@mailchain.com
	 */
	async user() {
		return this._userProfile.getUsername();
	}

	private async getSenderMailbox(
		fromAddress: Address,
		config: { messagingKeys: MessagingKeys; userProfile: UserProfile },
	): Promise<UserMailbox> {
		const mailboxes = await config.userProfile.mailboxes();

		const { identityKey } = await config.messagingKeys.resolve(fromAddress);
		if (identityKey == null) {
			throw Error(`${fromAddress} is not registered with Mailchain services`);
		}

		const foundMailbox = mailboxes.find((mailbox) => {
			// comparing raw address is case sensitive
			return isPublicKeyEqual(mailbox.identityKey, identityKey);
		});
		if (foundMailbox == null) {
			throw Error(`${fromAddress} is not registered by this account`);
		}

		return foundMailbox;
	}
}
