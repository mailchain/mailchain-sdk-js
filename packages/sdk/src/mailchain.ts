import { KeyRing } from '@mailchain/keyring';
import { decodeAddressByProtocol, MAILCHAIN } from '@mailchain/addressing';
import { ED25519PrivateKey } from '@mailchain/crypto';
import {
	FailedAddressMessageKeyResolutionsError,
	MailSender,
	PrepareResult,
	SendResult,
} from './internal/transport/mail/send';
import { Lookup } from './internal/identityKeys';
import { MailchainUserProfile, UserProfile } from './internal/user';
import { toUint8Array } from './internal/formatters/hex';
import { Mailbox, MailchainMailbox } from './internal/mailbox';
import { Address, SendMailParams } from './types';
import { toMailData } from './convertSendMailParams';

export type Configuration = {
	apiPath: string;
	mailchainAddressDomain: string;
};

const defaultConfiguration: Configuration = {
	apiPath: 'https://api.mailchain.com',
	mailchainAddressDomain: 'mailchain.com',
};

type MailSenderResult = SendResult | PrepareResult;

export type SendMailResult = {
	messageID: string;
} & MailSenderResult;

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
	 * const mnemonicPhrase = 'cat mail okay ...'; // securely include mnemonic phrase
	 *
	 * const mailchain = Mailchain.fromMnemonicPhrase(mnemonicPhrase); // use your mnemonic phrase
	 *
	 * const result = await mailchain.sendMail({
	 * 		from: `yoursername@mailchain.local`, // sender address
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
		const senderMessagingKey = await this.getSenderMessagingKey(params.from, {
			lookup: Lookup.create(this.config),
			userProfile: this._userProfile,
		});

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

	/**
	 * Gets the username and mail address corresponding to the authenticated user.
	 *
	 * @throws an error if the mnemonic phrase or seed does not have a user registered.
	 * A user must be registered via {@link https://app.mailchain.com/register}.
	 * Check the mnemonic phrase or seed is correct.
	 *
	 * @returns a promise containing the username and the mail address of the logged in user.
	 *
	 * @example
	 *
	 * import { Mailchain } from "@mailchain/sdk";
	 *
	 * const mnemonicPhrase = 'cat mail okay ...'; // securely include mnemonic phrase
	 *
	 * const mailchain = Mailchain.fromMnemonicPhrase(mnemonicPhrase); // use your mnemonic phrase
	 *
	 * const user = await mailchain.user();
	 *
	 * console.log(`username: ${user.username}, address: ${user.address}`);
	 * // username: alice, address: alice@mailchain.com
	 */
	async user() {
		return this._userProfile.getUsername();
	}

	private async getSenderMessagingKey(fromAddress: Address, config: { lookup: Lookup; userProfile: UserProfile }) {
		const fromPublicKey = await config.lookup.messageKey(fromAddress);
		if (fromPublicKey.address.protocol === MAILCHAIN) {
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
