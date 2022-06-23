import { VerifyMailchainProvidedMessagingKey } from '@mailchain/crypto/signatures/mailchain_msgkey';
import {
	AddressVerificationFailed,
	ErrorUnsupportedKey,
	PublicKeyNotFoundFailed,
} from '@mailchain/crypto/signatures/errors';
import { CreateProofMessage } from '@mailchain/keyreg/proofs/message';
import { ProofParams } from '@mailchain/keyreg/proofs/params';

import { ED25519PublicKey } from '@mailchain/crypto/ed25519';
import { DecodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/internal/protocols';
import { verify } from '@mailchain/crypto/signatures/verify';
import { Decode } from '@mailchain/encoding/encoding';
import { SECP256K1PublicKey } from '@mailchain/crypto/secp256k1';
import {
	AddressesApiFactory,
	PublicKeyCurveEnum,
	MessagingKeysApiFactory,
	Configuration,
	PublicKey,
	Address,
} from '../api';

// ToDo: move somewhere to generic
export const getPublicKeyFromApiResponse = (key: PublicKey) => {
	switch (key.curve) {
		case PublicKeyCurveEnum.Ed25519:
			return new ED25519PublicKey(Decode(key.encoding, key.value));
		case PublicKeyCurveEnum.Secp256k1:
			return new SECP256K1PublicKey(Decode(key.encoding, key.value));
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
};

export const getAddressFromApiResponse = (address: Address) => {
	return Decode(address.encoding!, address.value);
};

export async function lookupMessageKey(apiConfig: Configuration, address: string): Promise<PublicKey> {
	const addressApi = AddressesApiFactory(apiConfig);

	const result = await addressApi.getAddressMessagingKey(address);
	const { registeredKeyProof, providedKeyProof } = result.data;

	if (providedKeyProof) {
		const mailchainPublicKeyResponse = await MessagingKeysApiFactory(apiConfig).getMailchainPublicKey();

		if (!mailchainPublicKeyResponse.data.key?.value) throw new PublicKeyNotFoundFailed();
		const mailchainPublicKey = getPublicKeyFromApiResponse(mailchainPublicKeyResponse.data.key);

		if (!result.data.providedKeyProof?.signature) throw new AddressVerificationFailed();
		const isKeyValid = await VerifyMailchainProvidedMessagingKey(
			mailchainPublicKey,
			getPublicKeyFromApiResponse(result.data.messagingKey),
			DecodeHexZeroX(result.data.providedKeyProof?.signature),
			address,
			providedKeyProof.protocol as ProtocolType,
		);

		if (!isKeyValid) throw new AddressVerificationFailed();
	} else if (registeredKeyProof) {
		const params = {
			AddressEncoding: result.data.registeredKeyProof?.address.encoding,
			PublicKeyEncoding: result.data.registeredKeyProof?.messagingKeyEncoding,
			Locale: result.data.registeredKeyProof?.locale,
			Variant: result.data.registeredKeyProof?.variant,
		} as ProofParams;

		const message = CreateProofMessage(
			params,
			getAddressFromApiResponse(registeredKeyProof.address),
			getPublicKeyFromApiResponse(result.data.messagingKey),
			result.data.registeredKeyProof?.nonce!,
		);
		// verify the proof with the correct signer
		const isVerified = verify(
			result.data.registeredKeyProof?.signingMethod!,
			getPublicKeyFromApiResponse(result.data.registeredKeyProof?.identityKey!),
			Buffer.from(message),
			DecodeHexZeroX(result.data.registeredKeyProof?.signature!),
		);
		if (!isVerified) throw new AddressVerificationFailed();
	} else {
		throw new AddressVerificationFailed();
	}

	return result.data.messagingKey;
}
