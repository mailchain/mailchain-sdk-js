import { protocols } from '@mailchain/internal';
import { EncodeHexZeroX } from '@mailchain/encoding';
import { PublicKey } from '../public';
import { PrivateKey } from '../private';
import { AddressMustBeProtocolAddress, ErrorAddressIsEmpty, ErrorProtocolIsEmpty, ErrorUnsupportedKey } from './errors';
import { KindED25519 } from '../keys';
import { EncodePublicKey } from '../multikey/encoding';

export function mailchainProvidedMessagingKeyMessage(
	msgKey: PublicKey,
	address: string,
	protocol: protocols.ProtocolType,
) {
	if (address.length === 0) throw new ErrorAddressIsEmpty();
	if (protocol.length === 0) throw new ErrorProtocolIsEmpty();

	if (address.includes('@')) {
		throw new AddressMustBeProtocolAddress();
	}

	switch (msgKey.curve) {
		case KindED25519:
			const encodedKey = EncodeHexZeroX(EncodePublicKey(msgKey));

			return new Uint8Array(
				Buffer.from(
					`\x11Mailchain provided messaging key:\nAddress:${address}\nProtocol:${protocol}\nKey:${encodedKey}`,
				),
			);

		default:
			throw new ErrorUnsupportedKey(msgKey.curve);
	}
}

export function SignMailchainProvidedMessagingKey(
	key: PrivateKey,
	msgKey: PublicKey,
	address: string,
	protocol: protocols.ProtocolType,
): Promise<Uint8Array> {
	switch (key.curve) {
		case KindED25519:
			const msg = mailchainProvidedMessagingKeyMessage(msgKey, address, protocol);
			return key.sign(msg as Uint8Array);

		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export function VerifyMailchainProvidedMessagingKey(
	key: PublicKey,
	msgKey: PublicKey,
	signature: Uint8Array,
	address: string,
	protocol: protocols.ProtocolType,
): Promise<boolean> {
	switch (key.curve) {
		case KindED25519:
			const msg = mailchainProvidedMessagingKeyMessage(msgKey, address, protocol);

			return key.verify(msg as Uint8Array, signature);
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}
