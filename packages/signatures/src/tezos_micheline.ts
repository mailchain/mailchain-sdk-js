import {
	PublicKey,
	PrivateKey,
	ErrorUnsupportedKey,
	KindSECP256K1,
	KindED25519,
	KindSECP256R1,
} from '@mailchain/crypto';
import { encodeHex, decodeHex, decodeUtf8 } from '@mailchain/encoding';
import { blake2AsU8a } from '@polkadot/util-crypto';

export async function signTezosMessage(key: PrivateKey, msg: string) {
	const messagePayload = createTezosSignedMessagePayload(msg);
	return signTezosRaw(key, messagePayload);
}

export async function signTezosRaw(key: PrivateKey, payload: Uint8Array) {
	const bytesHash = blake2AsU8a(payload, 256);
	switch (key.curve) {
		case KindED25519:
		case KindSECP256R1:
			return key.sign(bytesHash);
		case KindSECP256K1:
			const sigObj = await key.sign(bytesHash);
			return sigObj.slice(0, 64);
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export async function verifyTezosSignedMessage(key: PublicKey, msg: string, signature: Uint8Array) {
	const messagePayload = createTezosSignedMessagePayload(msg);
	const bytesHash = blake2AsU8a(messagePayload, 256);
	switch (key.curve) {
		case KindED25519:
		case KindSECP256R1:
		case KindSECP256K1:
			return key.verify(bytesHash, signature);
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export function createTezosSignedMessagePayload(msg: string): Uint8Array {
	return formatAsTezosMicheline(decodeUtf8(`Tezos Signed Message: ${msg}`));
}

function formatAsTezosMicheline(payload: Uint8Array): Uint8Array {
	const bytesLength = payload.length.toString(16);
	const addPadding = `00000000${bytesLength}`;
	const paddedBytesLength = addPadding.slice(addPadding.length - 8);
	return decodeHex('0501' + paddedBytesLength + encodeHex(payload));
}
