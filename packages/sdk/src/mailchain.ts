import { KeyRing } from '@mailchain/keyring';
import { ED25519PrivateKey, isPublicKeyEqual } from '@mailchain/crypto';
import { EncodingTypes, ensureDecoded } from '@mailchain/encoding';
import {
	DistributeMailError,
	MailDistributor,
	MailPreparer,
	PrepareMailError,
	SentMailDeliveryRequests,
	Address,
	SendMailParams,
} from '@mailchain/internal/sending/mail';
import { MessagingKeys } from '@mailchain/internal/messagingKeys';
import { MailData, Payload } from '@mailchain/internal/transport';
import { Configuration, MailchainResult } from '@mailchain/internal';
import { toMailData } from '@mailchain/internal/sending/mail/convertSendMailParams';
import { MailchainUserProfile, UserProfile } from '@mailchain/internal/user';
import { MailboxOperations, MailchainMailboxOperations } from '@mailchain/internal/mailbox';
import { UserMailbox } from '@mailchain/internal/user/types';
import { defaultConfiguration } from '@mailchain/internal/configuration';
import {
	MailboxRuleEngine,
	MailchainRuleRepository,
	MailchainUserBlocklistRule,
} from '@mailchain/internal/mailboxRuleEngine';
import { defaultConditionHandlers } from '@mailchain/internal/mailboxRuleEngine/conditionsHandler';
import { defaultActionHandlers } from '@mailchain/internal/mailboxRuleEngine/actionsHandler';

export class Mailchain {
	private readonly _userProfile: UserProfile;
	private readonly _mailboxOperations: MailboxOperations;
	constructor(private readonly keyRing: KeyRing, private readonly config: Configuration) {
		this._userProfile = MailchainUserProfile.create(
			config,
			keyRing.accountIdentityKey(),
			keyRing.userMailboxCrypto(),
			keyRing.userSettingsCrypto(),
		);

		const mailchainUserBlocklist = MailchainUserBlocklistRule.create(this._userProfile);
		const mailchainRuleRepository = MailchainRuleRepository.create(
			() => Promise.resolve([mailchainUserBlocklist]),
			this._userProfile,
		);
		const mailboxRuleEngine = MailboxRuleEngine.create(mailchainRuleRepository.asRulesSource());

		this._mailboxOperations = MailchainMailboxOperations.create(config, keyRing, mailboxRuleEngine);

		mailboxRuleEngine.addConditionHandler(...defaultConditionHandlers(config));
		mailboxRuleEngine.addActionHandler(...defaultActionHandlers(this._mailboxOperations));
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
		const keyRing = KeyRing.fromSecretRecoveryPhrase(secretRecoveryPhrase, password);

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
	 * Send a mail to any blockchain or Mailchain address using any wallet registered in your Mailchain account.
	 *
	 * @param params {@link SendMailParams} information about message to send.
	 * Required:
	 * - `from` the address that the mail is being sent from.
	 * - At least one of `to`, `cc`, or `bcc`, who will receive the mail.
	 * - `subject` of the mail.
	 * - `content` both `html` and `text`.
	 * @param options {@link SendMailOptions} additional options for sending mail.
	 *
	 * @example
	 * import { Mailchain } from '@mailchain/sdk';
	 *
	 * const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE!; // 24 word mnemonicPhrase
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
	 * if (error) {
	 *   // handle error
	 *   console.warn('Mailchain error', error);
	 *   return;
	 * }
	 * // handle success send mail result
	 * console.log(data);
	 *
	 * @returns Status of the messaging sending request. {@link SentMail} contains different data
	 * depending on the status of the request.
	 */
	async sendMail(
		params: SendMailParams,
		options: SendMailOptions = defaultSendMailOptions,
	): Promise<MailchainResult<SentMail, SendMailError>> {
		const senderMailbox = await this.getSenderMailbox(params.from, {
			messagingKeys: MessagingKeys.create(this.config),
			userProfile: this._userProfile,
		});

		const senderMessagingKey = this.keyRing.addressBytesMessagingKey(
			senderMailbox.messagingKeyParams.address,
			senderMailbox.messagingKeyParams.protocol,
			senderMailbox.messagingKeyParams.nonce,
		);

		const preparer = MailPreparer.create(this.config);

		// prepare message
		const mailData = toMailData(params);

		const { data: preparedMail, error: preparedMailError } = await preparer.prepareMail({
			message: mailData,
			senderMessagingKey,
		});

		if (preparedMailError) {
			return { error: preparedMailError };
		}

		const savedMessageId = await this.saveSentMessage(
			senderMailbox,
			preparedMail.message,
			mailData,
			options.saveToSentFolder,
		);

		const distributor = MailDistributor.create(this.config, senderMessagingKey);

		const { data: distributedMail, error: distributedMailError } = await distributor.distributeMail({
			distributions: preparedMail.distributions,
			resolvedAddresses: preparedMail.resolvedAddresses,
		});

		if (distributedMailError) {
			return { error: distributedMailError };
		}

		if (options.saveToSentFolder && savedMessageId) {
			await this._mailboxOperations.markOutboxMessageAsSent(savedMessageId);
		}

		return {
			data: {
				savedMessageId,
				sentMailDeliveryRequests: distributedMail,
			},
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
	 * const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE!; // 24 word mnemonicPhrase
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

		const { data, error } = await config.messagingKeys.resolve(fromAddress);
		if (error) {
			throw error;
		}
		const { identityKey } = data;
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

	private async saveSentMessage(
		senderMailbox: UserMailbox,
		payload: Payload,
		content: MailData,
		saveToSentFolder?: boolean,
	) {
		if (saveToSentFolder) {
			const { messageId } = await this._mailboxOperations.saveSentMessage({
				userMailbox: senderMailbox,
				payload,
				content,
			});

			return messageId;
		}
		// no message id to return as not saved
		return;
	}
}

export type SendMailError = PrepareMailError | DistributeMailError;

export type SentMail = {
	/**
	 * The message ID of the message saved to the outbox/sent folder.
	 * This is only available when the message is saved to the outbox/sent folder.
	 * Saving to the outbox/sent folder is enabled by default and controlled by {@link SendMailOptions}.
	 */
	savedMessageId: string | undefined;
	sentMailDeliveryRequests: SentMailDeliveryRequests;
};

/**
 * Additional options for sending mail.
 */
export type SendMailOptions = {
	/**
	 * Prevents saving the sent message to the sent folder.
	 * This is useful when sending messages you don't want to be saved in the sent folder.
	 */
	saveToSentFolder?: boolean;
};

const defaultSendMailOptions: SendMailOptions = {
	saveToSentFolder: true,
};
