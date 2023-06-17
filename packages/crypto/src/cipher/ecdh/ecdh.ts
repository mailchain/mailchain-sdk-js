import { KeyExchange } from '..';
import { RandomFunction, secureRandom } from '../../rand';
import { PublicKey } from '../../public';
import { PrivateKey } from '../../private';
import { ED25519PublicKey } from '../../ed25519/public';
import { ED25519PrivateKey } from '../../ed25519/private';
import { ED25519KeyExchange } from './ed25519';

export function fromPublicKey(publicKey: PublicKey, rand: RandomFunction = secureRandom): KeyExchange {
	switch (publicKey.constructor) {
		case ED25519PublicKey:
			return new ED25519KeyExchange(rand);
		default:
			throw RangeError('unknown public key type');
	}
}

export function fromPrivateKey(privateKey: PrivateKey, rand: RandomFunction = secureRandom): KeyExchange {
	switch (privateKey.constructor) {
		case ED25519PrivateKey:
			return new ED25519KeyExchange(rand);
		default:
			throw RangeError('unknown private key type');
	}
}
