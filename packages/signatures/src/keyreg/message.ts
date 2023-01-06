import { encodePublicKey, PublicKey } from '@mailchain/crypto';
import { encode } from '@mailchain/encoding';
import { ProofParams } from './params';
import { getTemplate } from './templates';

export function createProofMessage(params: ProofParams, address: Uint8Array, msgKey: PublicKey, nonce: number): string {
	const encodedAddress = encode(params.AddressEncoding, address);
	const descriptivePublicKey = encodePublicKey(msgKey);
	const encodedPublicKey = encode(params.PublicKeyEncoding, descriptivePublicKey);
	const templateMessageFunc = getTemplate(params);

	return templateMessageFunc(encodedAddress, encodedPublicKey, nonce);
}
