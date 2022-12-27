import { EncodingType, EncodingTypes } from '@mailchain/encoding';
import { encodingByProtocol, ProtocolType } from '@mailchain/addressing';

export interface ProofParams {
	AddressEncoding: EncodingType;
	PublicKeyEncoding: EncodingType;
	Locale: string;
	Variant: string;
}

export function getLatestProofParams(protocol: ProtocolType, locale: string): ProofParams {
	const addressEncoding = encodingByProtocol(protocol);
	return {
		AddressEncoding: addressEncoding,
		PublicKeyEncoding: EncodingTypes.Hex0xPrefix,
		Locale: locale,
		Variant: 'simple-v1',
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
