import { IdED25519, IdNonSpecified, IdSECP256K1, IdSR25519, PublicKey } from '../..';
import { EncryptedContent, NACLECDH, NACLSK } from '..';
import { SECP256K1PublicKey } from '../../secp256k1';
import { ED25519PublicKey, ED25519PublicKeyLen } from '../../ed25519';
import { SR25519PublicKey, SR25519PublicKeyLen } from '../../sr25519';
import { idFromPublicKey } from '../../multikey';

export function serializePublicKeyEncryptedContent(sealedBox: EncryptedContent, pubKey: PublicKey): EncryptedContent {
	const out = new Uint8Array(sealedBox.length + pubKey.bytes.length + 2);

	out.set(new Uint8Array([NACLECDH]), 0);
	out.set(new Uint8Array([idFromPublicKey(pubKey)]), 1);
	out.set(pubKey.bytes, 2);
	out.set(sealedBox, 2 + pubKey.bytes.length);

	return out;
}

export function serializePrivateKeyEncryptedContent(sealedBox: EncryptedContent, keyId: number): EncryptedContent {
	const out = new Uint8Array(sealedBox.length + 2);

	out.set(new Uint8Array([NACLSK]), 0);
	out.set(new Uint8Array([keyId]), 1);
	out.set(sealedBox, 2);

	return out;
}

export function deserializePublicKeyEncryptedContent(input: Uint8Array): {
	encryptedContent: EncryptedContent;
	pubKey: PublicKey;
} {
	if (input[0] !== NACLECDH) {
		throw new Error('can not deserialize NaCl ECDH encrypted content');
	}

	if (input.length < 35) {
		throw new RangeError('cipher is too short'); // will result in error is less than this
	}
	const start = 2;
	let pubKeyEnd = 0;
	switch (input[1]) {
		case IdSECP256K1:
			pubKeyEnd = start + 33;
			return {
				pubKey: new SECP256K1PublicKey(input.slice(start, pubKeyEnd)),
				encryptedContent: input.slice(pubKeyEnd),
			};
		case IdED25519:
			pubKeyEnd = start + ED25519PublicKeyLen;
			return {
				pubKey: new ED25519PublicKey(input.slice(start, pubKeyEnd)),
				encryptedContent: input.slice(pubKeyEnd),
			};
		case IdSR25519:
			pubKeyEnd = start + SR25519PublicKeyLen;
			return {
				pubKey: new SR25519PublicKey(input.slice(start, pubKeyEnd)),
				encryptedContent: input.slice(pubKeyEnd),
			};
		default:
			throw Error('unrecognized pubKeyID');
	}
}

export function deserializePrivateKeyEncryptedContent(input: Uint8Array): {
	encryptedContent: EncryptedContent;
	keyId: number;
} {
	if (input[0] !== NACLSK) {
		throw new Error('can not deserialize NaCl secret key encrypted content');
	}

	if (input.length < 3) {
		throw new RangeError('cipher is too short'); // will result in error is less than this
	}

	if (![IdSECP256K1, IdSR25519, IdED25519, IdNonSpecified].includes(input[1])) {
		throw new RangeError('unknown key type');
	}

	return { encryptedContent: input.slice(2), keyId: input[1] };
}
