import { encodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { PublicKey } from '@mailchain/crypto/public';
import { encode } from '@mailchain/encoding/encoding';
import { ProofParams } from './params';
import { getTemplate } from './templates';

export function createProofMessage(params: ProofParams, address: Uint8Array, msgKey: PublicKey, nonce: number): string {
	const encodedAddress = encode(params.AddressEncoding, address);
	const descriptivePublicKey = encodePublicKey(msgKey);
	const encodedPublicKey = encode(params.PublicKeyEncoding, descriptivePublicKey);
	const templateMessageFunc = getTemplate(params);

	return templateMessageFunc(encodedAddress, encodedPublicKey, nonce);
}
