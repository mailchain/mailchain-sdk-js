// needed for documentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import type { ProtocolType } from '@mailchain/addressing';

/**
 * Mailchain address formatted in mail format.
 *
 * Format: `{address}@{protocol}.{network}.mailchain.com`
 * - `address` - the value of the address encoded with the protocol encoding.
 *   - Example: Ethereum address it is encoded with 0x prefixed Hex, resulting in something like `0x0E5736fbD198496Ef9A890a8D8be7538De9B2e0f`
 *   - Example: Mailchain address it is encoded with UTF-8, resulting in just regular text `alice`
 * - `protocol` - some of the supported protocols by mailchain {@link ProtocolType}
 *   - Optional: can be omitted when the protocol is 'mailchain'
 * - `network` - The network of the protocol
 *   - Optional: can be omitted if it is the main network/chain of the protocol.
 *
 * Examples:
 * - Ethereum address on Ethereum mainnet `0x0E5736fbD198496Ef9A890a8D8be7538De9B2e0f@ethereum.mailchain.com`
 * - Mailchain address `alice@mailchain.com`
 */
export type Address = string;

export type Attachment = {
	/** Unique identifier for the attachment that can be used to reference it to embed it into the content of the mail content. */
	cid: string;
	/** The name to appear when showing and downloading the attachment.  */
	name: string;
	/** `Base64` encoded value of the bytes or just `Buffer` from it. */
	content: string | Buffer;
};

export type SendMailParams = {
	/** Address for sending the mail. If not owned by the authenticated user, error is thrown. */
	from: Address;
	/** Address that the replies should be sent to instead of the {@link SendMailParams.from} address. */
	replyTo?: Address;
	/** The recipients that will appear in the `To:` field. */
	to?: Address[];
	/** The recipients that will appear in the `Cc:` field. */
	cc?: Address[];
	/**
	 * The recipients that will appear in the `Bcc:` field.
	 *
	 * Note: Mailchain SDK will take care to hide these recipients from others.
	 */
	bcc?: Address[];
	/** The subject of the email. */
	subject: string;
	content: {
		/** The HTML version of the message */
		html?: string | Buffer;
		/** The plaintext version of the message */
		text?: string | Buffer;
	};
	attachments?: Attachment[];
	/** The thread that this message belongs to */
	threadId?: string;
	/**
	 * Define custom set of headers. Most messages don't need defining custom headers, but if you do need this is the way.
	 *
	 * Note: any custom header that has property defined in the standard set of the {@link SendMessageParams} will get overwritten.
	 */

	headers?: { [key: string]: string | undefined };
};
