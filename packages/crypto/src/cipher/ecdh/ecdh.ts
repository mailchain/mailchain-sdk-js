import { KeyExchange } from '..';
import { PublicKey, PrivateKey, RandomFunction, secureRandom } from '../..';
import { SECP256K1PublicKey, SECP256K1PrivateKey } from '../../secp256k1';
import { ED25519PublicKey, ED25519PrivateKey } from '../../ed25519';
import { SR25519PublicKey, SR25519PrivateKey } from '../../sr25519';
import { ED25519KeyExchange } from './ed25519';
import { SR25519KeyExchange } from './sr25519';
import { SECP256K1KeyExchange } from './secp256k1';

export function fromPublicKey(publicKey: PublicKey, rand: RandomFunction = secureRandom): KeyExchange {
	switch (publicKey.constructor) {
		case ED25519PublicKey:
			return new ED25519KeyExchange(rand);
		case SECP256K1PublicKey:
			return new SECP256K1KeyExchange(rand);
		case SR25519PublicKey:
			return new SR25519KeyExchange(rand);
		default:
			throw RangeError('unknown public key type');
	}
}

export function fromPrivateKey(privateKey: PrivateKey, rand: RandomFunction = secureRandom): KeyExchange {
	switch (privateKey.constructor) {
		case ED25519PrivateKey:
			return new ED25519KeyExchange(rand);
		case SECP256K1PrivateKey:
			return new SECP256K1KeyExchange(rand);
		case SR25519PrivateKey:
			return new SR25519KeyExchange(rand);
		default:
			throw RangeError('unknown private key type');
	}
}
