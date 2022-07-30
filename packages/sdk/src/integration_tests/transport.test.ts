import { SECP256K1PrivateKey } from '@mailchain/crypto/secp256k1';
import { encodeBase58, EncodingTypes } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { secureRandom } from '@mailchain/crypto';
import { getOpaqueConfig, OpaqueID } from '@cloudflare/opaque-ts';
import { Lookup } from 'sdk/src/identityKeys';
import { KindNaClSecretKey } from '@mailchain/crypto/cipher';
import * as identityKeysApi from 'sdk/src/identityKeys';
import { protocols } from '@mailchain/internal';
import { ethers } from 'ethers';
import { createProofMessage, getLatestProofParams } from '@mailchain/keyreg';
import { decodeUtf8 } from '@mailchain/encoding/utf8';
import { signEthereumPersonalMessage } from '@mailchain/crypto/signatures/eth_personal';
import { Configuration } from '../api';
import { OpaqueConfig } from '../types';
import { encodeHexZeroX, encodeHex, decodeHexZeroX } from '../../../encoding/src/hex';
import { sendPayload } from '../transport/send';
import { Receiver } from '../transport/receive';
import { PayloadHeaders } from '../transport/payload/content/headers';
import { confirmDelivery } from '../transport/confirmations';
import { encodePublicKey } from '../../../crypto/src/multikey/encoding';
import { Authentication } from '../auth/auth';

jest.setTimeout(30000);

const params = getOpaqueConfig(OpaqueID.OPAQUE_P256);

const registerAddress = async (user) => {
	const walletPrivateKey = SECP256K1PrivateKey.generate();
	const wallet = new ethers.Wallet(walletPrivateKey.bytes);
	const { address } = wallet;

	const addressBytes = decodeHexZeroX(address);
	const nonce = 1;
	const proofParams = getLatestProofParams(protocols.ETHEREUM, '', 'en');
	const addressMessagingKey = user.keyRing.addressMessagingKey(addressBytes, protocols.ETHEREUM, nonce);
	const proofMessage = createProofMessage(proofParams, addressBytes, addressMessagingKey.publicKey, nonce);
	const signature = signEthereumPersonalMessage(walletPrivateKey, decodeUtf8(proofMessage));

	await identityKeysApi.registerAddress(apiConfig, {
		signature: encodeHexZeroX(signature),
		signatureMethod: 'ethereum_personal_message',
		address: {
			encoding: 'hex/0x-prefix',
			value: address,
			protocol: protocols.ETHEREUM,
			network: 'devnet',
		},
		locale: proofParams.Locale,
		messageVariant: proofParams.Variant,
		messagingKey: {
			curve: 'ed25519',
			encoding: 'hex/0x-prefix',
			value: encodeHexZeroX(addressMessagingKey.publicKey.bytes),
		},
		nonce,
		identityKey: encodeHexZeroX(encodePublicKey(walletPrivateKey.publicKey)),
	});
	return { address, addressBytes };
};

const config = {
	parameters: params,
	serverIdentity: 'Mailchain',
	context: 'MailchainAuthentication',
} as OpaqueConfig;

const apiConfig = new Configuration({ basePath: 'http://localhost:8080' });
const registerRandomUser = async () => {
	const mailchainAuth = Authentication.create(apiConfig, config);
	const username = encodeBase58(secureRandom(8)).toLowerCase();
	const seed = secureRandom(32);

	const identityKey = ED25519PrivateKey.fromSeed(seed);
	const keyRing = KeyRing.fromPrivateKey(identityKey);

	await mailchainAuth.register({
		username,
		password: 'qwerty',
		identityKeySeed: seed,
		captcha: '10000000-aaaa-bbbb-cccc-000000000001',
	});
	return { username, keyRing };
};
const getHeaders = async ({ user, payload, signingKey }): Promise<PayloadHeaders> => ({
	Origin: user.keyRing.accountMessagingKey().publicKey,
	ContentSignature: await signingKey.sign(payload),
	Created: new Date(),
	ContentLength: payload.length,
	ContentType: 'message/x.mailchain',
	ContentEncoding: EncodingTypes.Base64,
	ContentEncryption: KindNaClSecretKey,
});

describe('SendAndReceiveMessage', () => {
	let users: {
		username: string;
		keyRing: KeyRing;
	}[];
	let message: string;
	let headers: PayloadHeaders;
	const headersMultiple: PayloadHeaders[] = [];

	let etherAddresses: { address: string; addressBytes: Uint8Array }[];

	beforeAll(async () => {
		users = [await registerRandomUser(), await registerRandomUser()];
		message = [
			encodeHex(secureRandom(32)),
			encodeHex(secureRandom(32)),
			encodeHex(secureRandom(32)),
			encodeHex(secureRandom(32)),
			encodeHex(secureRandom(32)),
		].join('\n');
		etherAddresses = await Promise.all([registerAddress(users[1]), registerAddress(users[1])]);
	});
	afterEach(() => jest.resetAllMocks());

	it('verify messaging keys is correct', async () => {
		const data = [
			await Lookup.create(apiConfig).messageKey(`${users[0].username}@mailchain.local`),
			await Lookup.create(apiConfig).messageKey(`${users[1].username}@mailchain.local`),
		];

		expect(data[0].messageKey.value).toEqual(
			encodeHexZeroX(users[0].keyRing.accountMessagingKey().publicKey.bytes),
		);
		expect(data[1].messageKey.value).toEqual(
			encodeHexZeroX(users[1].keyRing.accountMessagingKey().publicKey.bytes),
		);
	});

	it('send message from user 1 to user 2', async () => {
		const payload = Buffer.from(message);
		headers = await getHeaders({ user: users[0], payload, signingKey: users[1].keyRing.accountMessagingKey() });

		await sendPayload(users[0].keyRing, apiConfig, [
			{
				recipient: { address: `${users[1].username}@mailchain.local`, name: users[1].username },
				payload: {
					Headers: headers,
					Content: payload,
				},
			},
		]);
	});

	it('receive message from user 2 to user 1', async () => {
		const payload = Buffer.from(message);
		const receiver = Receiver.create(apiConfig, users[1].keyRing.accountMessagingKey());

		const [delivery] = await receiver.getUndeliveredMessages();

		if (delivery.status === 'rejected') throw new Error('Should be fulfilled');
		expect(delivery.value.payload.Content).toEqual(payload);
		expect(delivery.value.payload.Headers).toEqual(headers);
	});

	it('receive message from user 2 to user 1 and acknowledge receiving', async () => {
		const receiver = Receiver.create(apiConfig, users[1].keyRing.accountMessagingKey());

		const [delivery] = await receiver.getUndeliveredMessages();
		if (delivery.status === 'rejected') throw new Error('Should be fulfilled');
		await confirmDelivery(apiConfig, users[1].keyRing.accountMessagingKey(), delivery.value.hash);

		const results = await receiver.getUndeliveredMessages();
		expect(results).toHaveLength(0);
	});

	it('send ethereum  message from user 1 to user 2', async () => {
		const payload = Buffer.from(message);
		const etherAccountMessageKey = users[1].keyRing.addressMessagingKey(
			etherAddresses[0].addressBytes,
			protocols.ETHEREUM,
			1,
		);
		headers = await getHeaders({ user: users[0], payload, signingKey: etherAccountMessageKey });

		await sendPayload(users[0].keyRing, apiConfig, [
			{
				recipient: {
					address: `${etherAddresses[0].address}@ethereum.mailchain.local`,
					name: etherAddresses[0].address,
				},
				payload: {
					Headers: headers,
					Content: payload,
				},
			},
		]);
	});
	it('receive ethereum message by user 2', async () => {
		const payload = Buffer.from(message);
		const etherAccountMessageKey = users[1].keyRing.addressMessagingKey(
			etherAddresses[0].addressBytes,
			protocols.ETHEREUM,
			1,
		);
		const receiver = Receiver.create(apiConfig, etherAccountMessageKey);

		const [delivery] = await receiver.getUndeliveredMessages();

		if (delivery.status === 'rejected') throw new Error('Should be fulfilled');
		expect(delivery.value.payload.Content).toEqual(payload);
		expect(delivery.value.payload.Headers).toEqual(headers);
		await confirmDelivery(apiConfig, etherAccountMessageKey, delivery.value.hash);

		const results = await receiver.getUndeliveredMessages();
		expect(results).toHaveLength(0);
	});

	it('send multiple ethereum messages from user 1 to user 2', async () => {
		await Promise.all(
			etherAddresses.map(async (it, index) => {
				const payload = Buffer.from(`from ${users[0].username} to ${it.address}`);
				const etherAccountMessageKey = users[1].keyRing.addressMessagingKey(
					it.addressBytes,
					protocols.ETHEREUM,
					1,
				);
				headersMultiple[index] = await getHeaders({
					user: users[0],
					payload,
					signingKey: etherAccountMessageKey,
				});
				return sendPayload(users[0].keyRing, apiConfig, [
					{
						recipient: {
							address: `${it.address}@ethereum.mailchain.local`,
							name: it.address,
						},
						payload: {
							Headers: headersMultiple[index],
							Content: payload,
						},
					},
				]);
			}),
		);
	});

	it('receive multiple ethereum messages from user 1 to user 2 on different ether addresses', async () => {
		etherAddresses.map(async (it, index) => {
			const messagingKey = users[1].keyRing.addressMessagingKey(it.addressBytes, protocols.ETHEREUM, 1);
			const receiver = Receiver.create(apiConfig, messagingKey);

			const results = await receiver.getUndeliveredMessages();
			expect(results[index][0]).toBeDefined();
			expect(results[index][0].payload!.Content).toEqual(
				Buffer.from(`from ${users[0].username} to ${it.address}`),
			);
			expect(results[index][0].payload!.Headers).toEqual(headersMultiple[index]);

			await Promise.all(
				results.map(async (result) => {
					if (result.status === 'rejected') throw new Error('Should be fulfilled');
					await confirmDelivery(apiConfig, messagingKey, result.value.hash);
				}),
			);

			const postConfirmedUndelivered = await receiver.getUndeliveredMessages();
			expect(postConfirmedUndelivered.length).toEqual(0);
		});
	});
});
