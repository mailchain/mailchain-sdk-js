import { secretbox } from 'tweetnacl';
import { RandomFunction } from '../../rand';

const nonceSize = 24;
const secretKeySize = 32;

export function easySeal(message: Uint8Array | Buffer, secretKey: Uint8Array, rand: RandomFunction): Uint8Array {
	const messagePrivate = message instanceof Buffer ? new Uint8Array(message) : message; // ensure it's a Uint8Array as secretbox checks instance of

	if (secretKey.length !== secretKeySize) {
		throw new RangeError('secret key must be 32 bytes');
	}

	const nonce = rand(nonceSize);

	const encrypted = secretbox(messagePrivate, nonce, secretKey);
	const out = new Uint8Array(nonceSize + encrypted.length);
	out.set(nonce, 0);
	out.set(new Uint8Array(encrypted), nonceSize);

	return out;
}

export function easyOpen(sealedBox: Uint8Array, secretKey: Uint8Array): Uint8Array {
	const sealedBoxPrivate = sealedBox instanceof Buffer ? new Uint8Array(sealedBox) : sealedBox; // ensure it's a Uint8Array as secretbox checks instance of

	if (secretKey.length !== secretKeySize) {
		throw new RangeError('secret key must be 32 bytes');
	}

	if (sealedBoxPrivate.length < nonceSize) {
		throw new RangeError('secret box must be longer than nonce');
	}

	const nonce = sealedBoxPrivate.slice(0, nonceSize);
	const seal = sealedBoxPrivate.slice(nonceSize);

	const ret = secretbox.open(seal, nonce, secretKey);
	if (ret === null) {
		throw new Error('secretbox: could not decrypt data with private key');
	}

	return ret;
}
