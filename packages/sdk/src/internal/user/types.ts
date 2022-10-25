import { MailchainAddress, ProtocolType } from '@mailchain/addressing';
import { PublicKey } from '@mailchain/crypto';

/**
 * Represents different type of alias to be set for the {@link UserMailbox}.
 */
export type Alias = {
	address: MailchainAddress;
	isDefault: boolean;
	allowSending: boolean;
	allowReceiving: boolean;
};

/**
 * Entity for sending and receiving messages based on the provided identity key and messaging key.
 */
export type UserMailbox = {
	id: string;
	/**
	 * - `'account'` - Mailchain account (example: `'alice@mailchain.com'`).
	 * - `'wallet'` - registered mailbox based blockchain wallet identity key (example: `'0xEBaae0532dF65ee3f1623f324C9620bB84c8af8d@ethereum.mailchain.com'`)
	 */
	type: 'account' | 'wallet';
	identityKey: PublicKey;
	/** The user preferred label to shown for this mailbox. If `null`, no user preferred label is defined, the application is free to compute one at runtime. */
	label: string | null;
	/** Will contain at least one defined {@link Alias}. */
	aliases: [Alias, ...Alias[]];
	/** Ingredients for the creation of messaging private key via the keyring. */
	messagingKeyParams: {
		address: Uint8Array;
		protocol: ProtocolType;
		network: string;
		nonce: number;
	};
};
