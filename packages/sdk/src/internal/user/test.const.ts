import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import {
	createMailchainAddress,
	decodeAddressByProtocol,
	encodeAddressByProtocol,
	ETHEREUM,
	MAILCHAIN,
} from '@mailchain/addressing';
import { KeyRing } from '@mailchain/keyring';
import { AliceSECP256K1PublicAddress, BobSECP256K1PublicAddress } from '../ethereum/test.const';
import { UserMailbox } from './types';

export const AliceWalletMailbox: UserMailbox = {
	id: 'alice-ethereum-mailbox',
	type: 'wallet',
	identityKey: AliceSECP256K1PublicKey,
	sendAs: [
		createMailchainAddress(
			encodeAddressByProtocol(AliceSECP256K1PublicAddress, ETHEREUM).encoded,
			ETHEREUM,
			'mailchain.test',
		),
	],
	messagingKeyParams: {
		address: AliceSECP256K1PublicAddress,
		protocol: ETHEREUM,
		network: 'test',
		nonce: 1,
	},
};

const aliceKeyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
export const AliceAccountMailbox: UserMailbox = {
	id: 'alice@mailchain.test',
	type: 'account',
	identityKey: aliceKeyRing.accountIdentityKey().publicKey,
	sendAs: [createMailchainAddress('alice', MAILCHAIN, 'mailchain.test')],
	messagingKeyParams: {
		address: decodeAddressByProtocol('alice', MAILCHAIN).decoded,
		protocol: MAILCHAIN,
		network: 'mailchain.test',
		nonce: 1,
	},
};

export const BobWalletMailbox: UserMailbox = {
	id: 'bob-ethereum-mailbox',
	type: 'wallet',
	identityKey: BobSECP256K1PublicKey,
	sendAs: [
		createMailchainAddress(
			encodeAddressByProtocol(BobSECP256K1PublicAddress, ETHEREUM).encoded,
			ETHEREUM,
			'mailchain.test',
		),
	],
	messagingKeyParams: {
		address: BobSECP256K1PublicAddress,
		protocol: ETHEREUM,
		network: 'test',
		nonce: 5,
	},
};

const bobKeyRing = KeyRing.fromPrivateKey(BobED25519PrivateKey);
export const BobAccountMailbox: UserMailbox = {
	id: 'bob@mailchain.com',
	type: 'account',
	identityKey: bobKeyRing.accountIdentityKey().publicKey,
	sendAs: [createMailchainAddress('bob', MAILCHAIN, 'mailchain.test')],
	messagingKeyParams: {
		address: decodeAddressByProtocol('bob', MAILCHAIN).decoded,
		protocol: MAILCHAIN,
		network: 'mailchain.test',
		nonce: 1,
	},
};
