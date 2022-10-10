import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { createWalletAddress, decodeAddressByProtocol, ETHEREUM, MAILCHAIN } from '@mailchain/addressing';
import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import {
	AliceSECP256K1PublicAddress,
	AliceSECP256K1PublicAddressStr,
	BobSECP256K1PublicAddress,
	BobSECP256K1PublicAddressStr,
} from '../ethereum/test.const';
import { UserMailbox } from './types';

export const AliceWalletMailbox: UserMailbox = {
	id: 'alice-ethereum-mailbox',
	type: 'wallet',
	identityKey: AliceSECP256K1PublicKey,
	sendAs: [createWalletAddress(AliceSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test')],
	messagingKeyParams: {
		address: AliceSECP256K1PublicAddress,
		protocol: ETHEREUM,
		network: 'test',
		nonce: 1,
	},
};

export const AliceAccountMailbox: UserMailbox = {
	id: 'alice@mailchain.test',
	type: 'account',
	identityKey: aliceKeyRing.accountIdentityKey().publicKey,
	sendAs: [createWalletAddress('alice', MAILCHAIN, 'mailchain.test')],
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
	sendAs: [createWalletAddress(BobSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test')],
	messagingKeyParams: {
		address: BobSECP256K1PublicAddress,
		protocol: ETHEREUM,
		network: 'test',
		nonce: 5,
	},
};

export const BobAccountMailbox: UserMailbox = {
	id: 'bob@mailchain.com',
	type: 'account',
	identityKey: bobKeyRing.accountIdentityKey().publicKey,
	sendAs: [createWalletAddress('bob', MAILCHAIN, 'mailchain.test')],
	messagingKeyParams: {
		address: decodeAddressByProtocol('bob', MAILCHAIN).decoded,
		protocol: MAILCHAIN,
		network: 'mailchain.test',
		nonce: 1,
	},
};
