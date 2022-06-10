import { protocols } from '@mailchain/internal';
import { DecodeHexZeroX, EncodeHexZeroX, EncodingType, EncodingTypes } from '@mailchain/encoding';
import { IdFromPublicKey } from '../multikey';
import { PublicKey } from '../public';
import { ED25519PublicKey } from '../ed25519/public';
import { PrivateKey } from '../private';
import { ErrorAddressIsEmpty, ErrorProtocolIsEmpty, ErrorUnsupportedKey } from './errors';
import { RegisteredKeyProof, RegisteredKeyProofSigningMethodEnum } from '@mailchain/api/api';
import { CreateProofMessage } from '@mailchain/keyreg/proofs/message';
import { verifyRawEd25519 } from './raw_ed25119';

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
			`\x11Mailchain provided messaging key:\nAddress:${
				address.split('@')[0]
			}\nProtocol:${protocol}\nKey:${encodedKey}`,
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
	keyProof?: RegisteredKeyProof,
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
	if (keyProof) {
		const proofMessage = CreateProofMessage(
			{
				AddressEncoding: keyProof?.address.encoding! as EncodingType,
				PublicKeyEncoding: keyProof?.messagingKeyEncoding! as EncodingType,
				Locale: keyProof?.locale!,
				Variant: keyProof?.variant!,
			},
			new Uint8Array(Buffer.from(keyProof?.address.value)),
			msgKey,
			1,
		);
		if (keyProof.signingMethod === RegisteredKeyProofSigningMethodEnum.RawEd25519) {
			return verifyRawEd25519(key, new Uint8Array(Buffer.from(proofMessage)), signature);
		}
		return key.Verify(new Uint8Array(Buffer.from(proofMessage)), signature);
	}
	const msg = mailchainProvidedMessagingKeyMessage(msgKey, address, protocol);

	return key.Verify(msg as Uint8Array, signature);
}
