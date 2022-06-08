import { protocols } from '@mailchain/internal';
import { EncodeHexZeroX } from '@mailchain/encoding';
import { IdFromPublicKey } from '../multikey';
import { PublicKey } from '../public';
import { ED25519PublicKey } from '../ed25519/public';
import { PrivateKey } from '../private';
import { ErrorAddressIsEmpty, ErrorProtocolIsEmpty, ErrorUnsupportedKey } from './errors';

function DescriptiveBytesFromPublicKey(key: PublicKey) {
	const idByte = IdFromPublicKey(key);
	return Buffer.from([idByte, ...key.Bytes]);
}

export function mailchainProvidedMessagingKeyMessage(
	msgKey: PublicKey,
	address: string,
	protocol: protocols.ProtocolType,
) {
	if (address.length === 0) throw new ErrorAddressIsEmpty();
	if (protocol.length === 0) throw new ErrorProtocolIsEmpty();
	let descriptiveKey: Buffer | null = null;
	// check for type ed25519.PublicKey

	switch (msgKey.constructor) {
		case ED25519PublicKey: {
			descriptiveKey = DescriptiveBytesFromPublicKey(msgKey);
			break;
		}

		default:
			throw new ErrorUnsupportedKey();
	}
	const encodedKey = EncodeHexZeroX(descriptiveKey);

	return new Uint8Array(
		Buffer.from(
			`\x11Mailchain provided messaging key:\nAddress:${address}\nProtocol:${protocol}\nKey:${encodedKey}`,
		),
	);
}

export function SignMailchainProvidedMessagingKey(
	key: PrivateKey,
	msgKey: PublicKey,
	address: string,
	protocol: protocols.ProtocolType,
): Promise<Uint8Array> {
	switch (msgKey.constructor) {
		case ED25519PublicKey: {
			break;
		}

		default:
			throw new ErrorUnsupportedKey();
	}
	const msg = mailchainProvidedMessagingKeyMessage(msgKey, address, protocol);
	return key.Sign(msg as Uint8Array);
}

export function VerifyMailchainProvidedMessagingKey(
	key: PublicKey,
	msgKey: PublicKey,
	signature: Uint8Array,
	address: string,
	protocol: protocols.ProtocolType,
): Promise<boolean> {
	switch (msgKey.constructor) {
		case ED25519PublicKey: {
			break;
		}

		default:
			throw new ErrorUnsupportedKey();
	}
	switch (key.constructor) {
		case ED25519PublicKey: {
			break;
		}

		default:
			throw new ErrorUnsupportedKey();
	}
	const msg = mailchainProvidedMessagingKeyMessage(msgKey, address, protocol);
	return key.Verify(msg as Uint8Array, signature);
}
