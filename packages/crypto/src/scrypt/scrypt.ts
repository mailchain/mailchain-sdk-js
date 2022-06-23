import { scrypt } from '@noble/hashes/scrypt';
import { secureRandom } from '../rand';

export type ScryptParams = {
	N: number;
	r: number;
	p: number;
	keyLen: number;
};

export const defaultScryptParams: ScryptParams = {
	// N is the N parameter of Scrypt encryption algorithm, using 256MB
	// memory and taking approximately 1s CPU time on a modern processor.
	N: 1 << 18,
	// P is the P parameter of Scrypt encryption algorithm, using 256MB
	// memory and taking approximately 1s CPU time on a modern processor.
	p: 1,
	r: 8,
	keyLen: 32,
};

interface Result {
	params: ScryptParams;
	secret: Uint8Array;
	salt: Uint8Array;
}

export function deriveSecretFromScrypt(
	passphrase = '',
	params: ScryptParams = defaultScryptParams,
	salt: Uint8Array = secureRandom(32),
): Result {
	const secret = scrypt(new Uint8Array(Buffer.from(passphrase, 'ascii')), salt, {
		N: params.N,
		r: params.r,
		p: params.p,
		dkLen: params.keyLen,
	});

	return {
		params,
		secret,
		salt,
	};
}
