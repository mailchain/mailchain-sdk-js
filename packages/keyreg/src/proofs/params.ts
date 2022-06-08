import { EncodingType, EncodingTypes } from '@mailchain/encoding';
import { EncodingByProtocol } from '@mailchain/internal/addressing/encoding';
import { ETHEREUM, ProtocolType } from '@mailchain/internal/protocols';

export interface ProofParams {
	AddressEncoding: EncodingType;
	PublicKeyEncoding: EncodingType;
	Locale: string;
	Variant: string;
}

export function getLatestProofParams(protocol: ProtocolType, network: string, locale: string): ProofParams {
	const addressEncoding = EncodingByProtocol(protocol);

	if (protocol !== ETHEREUM) {
		// TODO: implement other protocols
		throw new Error('must be ethereum');
	}

	return {
		AddressEncoding: addressEncoding,
		PublicKeyEncoding: EncodingTypes.Hex0xPrefix, // TODO: create MsgKey encoding
		Locale: locale,
		Variant: 'simple-v1', // TODO: needs to be based on protocol
	};
}

export function getMailchainUsernameParams(): ProofParams {
	return {
		AddressEncoding: EncodingTypes.Utf8,
		PublicKeyEncoding: EncodingTypes.Hex0xPrefix,
		Locale: 'en',
		Variant: 'mailchain-username',
	};
}
