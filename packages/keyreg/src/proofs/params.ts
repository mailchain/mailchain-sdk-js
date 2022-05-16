import { Encodings, HEX_0X_PREFIX } from '@mailchain/encoding/consts';
import { EncodingByProtocol } from '@mailchain/internal/adressing/encoding';
import { Ethereum } from '@mailchain/internal/protocols';

export interface ProofParams {
	AddressEncoding: Encodings;
	PublicKeyEncoding: Encodings;
	Locale: string;
	Variant: string;
}

export function GetLatestProofParams(protocol: string, network: string, locale: string): ProofParams {
	const addressEncoding = EncodingByProtocol(protocol);

	if (protocol !== Ethereum) {
		// TODO: implement other protocols
		throw new Error('must be ethereum');
	}

	return {
		AddressEncoding: addressEncoding,
		PublicKeyEncoding: HEX_0X_PREFIX, // TODO: create MsgKey encoding
		Locale: locale,
		Variant: 'simple-v1', // TODO: needs to be based on protocol
	} as ProofParams;
}
