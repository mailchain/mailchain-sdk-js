import { EncodingType, EncodingTypes } from '@mailchain/encoding';
import { encodingByProtocol, ETHEREUM, ProtocolType } from '@mailchain/addressing';

export interface ProofParams {
	AddressEncoding: EncodingType;
	PublicKeyEncoding: EncodingType;
	Locale: string;
	Variant: string;
}

export function getLatestProofParams(protocol: ProtocolType, locale: string): ProofParams {
	if (protocol !== ETHEREUM) {
		// TODO: implement other protocols
		throw new Error('must be ethereum');
	}

	const addressEncoding = encodingByProtocol(protocol);
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
