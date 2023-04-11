import { PublicKey, PrivateKey, KindSECP256K1, ErrorUnsupportedKey } from '@mailchain/crypto';
import { decodeHexZeroX } from '@mailchain/encoding';

export async function verifyEthereumPersonalMessage(
	key: PublicKey,
	message: Uint8Array,
	signature: Uint8Array,
): Promise<boolean> {
	switch (key.curve) {
		case KindSECP256K1:
			const messageHash = await getMessageHash(message);
			return key.verify(messageHash, signature);
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export async function signEthereumPersonalMessage(key: PrivateKey, message: Uint8Array): Promise<Uint8Array> {
	switch (key.curve) {
		case KindSECP256K1:
			const messageHash = await getMessageHash(message);

			return key.sign(messageHash);
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export async function getMessageHash(message: Uint8Array): Promise<Uint8Array> {
	const { hashMessage } = await import('@ethersproject/hash');
	return decodeHexZeroX(hashMessage(message));
}
