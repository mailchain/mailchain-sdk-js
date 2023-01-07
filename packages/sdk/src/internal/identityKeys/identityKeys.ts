import { encodeAddressByProtocol, formatAddress, MailchainAddress, ProtocolType } from '@mailchain/addressing';
import { decodePublicKey, encodePublicKey, PublicKey } from '@mailchain/crypto';
import { decodeHexZeroX, encodeHexZeroX } from '@mailchain/encoding';
import Axios from 'axios';
import {
	AddressesApiFactory,
	AddressesApiInterface,
	IdentityKeysApiFactory,
	IdentityKeysApiInterface,
	createAxiosConfiguration,
	CryptoKeyConvert,
	encodingTypeToEncodingEnum,
} from '@mailchain/api';
import { Configuration } from '../../mailchain';

export type SignProofResult = {
	identityKey: PublicKey;
	address: Uint8Array;
	protocol: ProtocolType;
	network: string;
	locale: string;
	messageVariant: string;
	nonce: number;
	signature: Uint8Array;
	signatureMethod: 'ethereum_personal_message';
	messagingKey: PublicKey;
};

export class IdentityKeys {
	constructor(
		private readonly addressesApi: AddressesApiInterface,
		private readonly identityKeysApi: IdentityKeysApiInterface,
	) {}

	static create(config: Configuration) {
		return new IdentityKeys(
			AddressesApiFactory(createAxiosConfiguration(config.apiPath)),
			IdentityKeysApiFactory(createAxiosConfiguration(config.apiPath)),
		);
	}

	async getAddressIdentityKey(
		address: MailchainAddress,
	): Promise<{ identityKey: PublicKey; protocol: ProtocolType } | null> {
		return this.addressesApi
			.getAddressIdentityKey(formatAddress(address, 'mail'))
			.then(({ data }) => ({
				identityKey: decodePublicKey(decodeHexZeroX(data.identityKey)),
				protocol: data.protocol as ProtocolType,
			}))
			.catch((e) => {
				if (Axios.isAxiosError(e)) {
					if (e.response?.data?.message === 'address not found') {
						return null;
					}
				}
				throw e;
			});
	}

	async putAddressMessagingKey(signProofRes: SignProofResult): Promise<void> {
		const encodedIdentityKey = encodeHexZeroX(encodePublicKey(signProofRes.identityKey));
		const encodedAddress = encodeAddressByProtocol(signProofRes.address, signProofRes.protocol);
		await this.identityKeysApi.putMsgKeyByIDKey(encodedIdentityKey, {
			address: {
				encoding: encodingTypeToEncodingEnum(encodedAddress.encoding),
				value: encodedAddress.encoded,
				network: signProofRes.network,
				protocol: signProofRes.protocol,
			},
			locale: signProofRes.locale,
			messageVariant: signProofRes.messageVariant,
			messagingKey: CryptoKeyConvert.public(signProofRes.messagingKey),
			nonce: signProofRes.nonce,
			signature: encodeHexZeroX(signProofRes.signature),
			signatureMethod: signProofRes.signatureMethod,
		});
	}
}
