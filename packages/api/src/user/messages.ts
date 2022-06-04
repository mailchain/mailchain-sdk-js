import { ethers } from 'ethers';
import { CreateProofMessage, getLatestProofParams } from '@mailchain/keyreg';
import { protocols } from '@mailchain/internal';
import { KeyRing } from '@mailchain/keyring';
import { SECP256K1PublicKey } from '@mailchain/crypto/secp256k1';
import { EncodeHexZeroX, DecodeHexZeroX } from '@mailchain/encoding';
import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { verify } from '../identityKeys';
import { Configuration, PublicKey } from '../api';
import { Protocols } from '@mailchain/internal/protocols';
import { AddressVerificationFailed } from '@mailchain/crypto/signatures/errors';

export type SignProofResult = {
	identityKey: string;
	address: {
		encoding: 'hex/0x-prefix';
		value: string;
	};
	locale: string;
	messageVariant: string;
	network: string;
	protocol: string;
	nonce: number;
	signature: string;
	signatureMethod: 'ethereum_personal_message';
	messagingKey: {
		curve: 'ed25519';
		encoding: 'hex/0x-prefix';
		value: string;
	};
};

export async function signProofMessage(
	apiConfig: Configuration,
	keyRing: KeyRing,
	provider: ethers.providers.Web3Provider,
	address: string,
	protocol: Protocols = Protocols.Ethereum,
): Promise<SignProofResult> {
	const accountBytes = DecodeHexZeroX(address);

	const networkName = provider.network.name;

	const addressIdentity = keyRing.createIdentityKeyForAddress(accountBytes, Protocols[protocol], networkName);

	const nonce = 1; // TODO: get it from the api using the `address`. See Issue #67
	const proofParams = getLatestProofParams(Protocols[protocol], networkName, 'en');
	const proofMessage = CreateProofMessage(proofParams, accountBytes, addressIdentity.PublicKey, nonce);

	const signer = provider.getSigner(address);
	const signedMsg = await signer.signMessage(proofMessage);

	const publicKey = await SECP256K1PublicKey.FromSignature(
		ethers.utils.toUtf8Bytes(proofMessage),
		DecodeHexZeroX(signedMsg),
	);
	const result = await verify(apiConfig, address, Protocols[protocol]);
	if (!result) throw new AddressVerificationFailed();
	return {
		identityKey: EncodeHexZeroX(EncodePublicKey(publicKey)),
		address: {
			encoding: 'hex/0x-prefix',
			value: address,
		},
		locale: proofParams.Locale,
		messageVariant: proofParams.Variant,
		network: networkName,
		protocol: protocols.Ethereum,
		nonce,
		signature: signedMsg,
		signatureMethod: 'ethereum_personal_message',
		messagingKey: {
			curve: 'ed25519',
			encoding: 'hex/0x-prefix',
			value: EncodeHexZeroX(addressIdentity.PublicKey.Bytes),
		},
	};
}
