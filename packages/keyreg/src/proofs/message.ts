import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { PublicKey } from '@mailchain/crypto/public';
import { Encode } from '@mailchain/encoding/encoding';
import { ProofParams } from './params';
import { getTemplate } from './templates';

export function CreateProofMessage(params: ProofParams, address: Uint8Array, msgKey: PublicKey, nonce: number): string {
	const encodedAddress = Encode(params.AddressEncoding, address);
	const descriptivePublicKey = EncodePublicKey(msgKey);
	const encodedPublicKey = Encode(params.PublicKeyEncoding, descriptivePublicKey);

	const templateMessageFunc = getTemplate(params);

	return templateMessageFunc(encodedAddress, encodedPublicKey, nonce);
}
