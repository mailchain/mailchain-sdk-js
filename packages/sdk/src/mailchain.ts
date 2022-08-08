import { KeyRing } from '@mailchain/keyring';
import { protocols } from '@mailchain/internal';
import { decodeAddressByProtocol } from '@mailchain/internal/addressing';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { MailSender } from './internal/transport/mail/send';
import { MailData } from './internal/formatters/types';
import { Lookup } from './internal/identityKeys';
import { MailchainUserProfile, UserProfile } from './internal/user';
import { toUint8Array } from './internal/formatters/hex';

export type Configuration = {
	apiPath: string;
};

const defaultConfiguration = { apiPath: 'https:/api.mailchain.com' };

export class Mailchain {
	private readonly _userProfile: UserProfile;
	constructor(private readonly keyRing: KeyRing, private readonly config: Configuration) {
		this._userProfile = MailchainUserProfile.create(
			config,
			keyRing.accountIdentityKey(),
			keyRing.userProfileCrypto(),
		);
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

	async sendMail(params: { message: MailData }) {
		const senderMessagingKey = await this.getSenderMessagingKey(params, {
			lookup: Lookup.create(this.config),
			userProfile: MailchainUserProfile.create(
				this.config,
				this.keyRing.accountIdentityKey(),
				this.keyRing.userProfileCrypto(),
			),
		});

		return MailSender.create(this.config, senderMessagingKey).send({
			message: params.message,
			senderMessagingKey,
		});
	}

	async self() {
		return this._userProfile.getUsername();
	}

	private async getSenderMessagingKey(
		params: { message: MailData },
		config: { lookup: Lookup; userProfile: UserProfile },
	) {
		const fromPublicKey = await config.lookup.messageKey(params.message.from.address);
		if (fromPublicKey.address.protocol == protocols.MAILCHAIN) {
			return this.keyRing.accountMessagingKey();
		}

		const registeredAddresses = await config.userProfile.addresses();

		const foundRegisteredAddress = registeredAddresses.find((x) => {
			// comparing raw address is case sensitive
			return x.address === fromPublicKey.address.value && x.protocol === fromPublicKey.address.protocol;
		});

		if (!foundRegisteredAddress) {
			throw Error(`${params.message.from.address} is not registered by this account`);
		}

		return this.keyRing.addressMessagingKey(
			decodeAddressByProtocol(foundRegisteredAddress.address, foundRegisteredAddress.protocol).decoded,
			foundRegisteredAddress.protocol,
			foundRegisteredAddress.nonce,
		);
	}
}
