import { SECP256K1PrivateKey } from '@mailchain/crypto/secp256k1';
import { EncodeBase58, EncodingTypes } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { secureRandom } from '@mailchain/crypto';
import { getOpaqueConfig, OpaqueID } from '@cloudflare/opaque-ts';
import { lookupMessageKey } from '@mailchain/api/identityKeys';
import { KindNaClSecretKey } from '@mailchain/crypto/cipher';
import * as identityKeysApi from '@mailchain/api/identityKeys';
import { protocols } from '@mailchain/internal';
import { ethers } from 'ethers';
import { CreateProofMessage, getLatestProofParams } from '@mailchain/keyreg';
import { DecodeUtf8 } from '@mailchain/encoding/utf8';
import { signEthereumPersonalMessage, VerifyEthereumPersonalMessage } from '@mailchain/crypto/signatures/eth_personal';
import { Configuration, ConfigurationParameters } from '../api';
import { OpaqueConfig } from '../types';
import { Register } from '../auth/register';
import { EncodeHexZeroX, EncodeHex, DecodeHexZeroX } from '../../../encoding/src/hex';
import { sendPayload } from '../transport/send';
import { Receiver } from '../transport/receive';
import { PayloadHeaders } from '../transport/content/headers';
import { confirmDelivery } from '../transport/confirmations';
import { EncodePublicKey } from '../../../crypto/src/multikey/encoding';
import { findAlarmThresholds } from 'aws-cdk-lib/aws-autoscaling-common';

jest.setTimeout(30000);

const params = getOpaqueConfig(OpaqueID.OPAQUE_P256);

const registerAddress = async (user) => {
	const walletPrivateKey = SECP256K1PrivateKey.generate();
	const wallet = new ethers.Wallet(walletPrivateKey.bytes);
	const { address } = wallet;

	const addressBytes = DecodeHexZeroX(address);
	const nonce = 1;
	const proofParams = getLatestProofParams(protocols.ETHEREUM, '', 'en');
	const addressMessagingKey = user.keyRing.addressMessagingKey(addressBytes, protocols.ETHEREUM, nonce);
	const proofMessage = CreateProofMessage(proofParams, addressBytes, addressMessagingKey.publicKey, nonce);
	const signature = signEthereumPersonalMessage(walletPrivateKey, Buffer.from(DecodeUtf8(proofMessage)));

	await identityKeysApi.registerAddress(apiConfig, {
		signature: EncodeHexZeroX(signature),
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
			value: EncodeHexZeroX(addressMessagingKey.publicKey.bytes),
		},
		nonce,
		identityKey: EncodeHexZeroX(EncodePublicKey(walletPrivateKey.publicKey)),
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
	const username = EncodeBase58(secureRandom(8)).toLowerCase();
	const seed = secureRandom(32);

	const identityKey = ED25519PrivateKey.fromSeed(seed);
	const keyRing = KeyRing.fromPrivateKey(identityKey);

	await Register({
		identityKeySeed: seed,
		username,
		password: 'qwerty',
		captchaResponse: 'captcha',
		messagingPublicKey: keyRing.accountMessagingKey().publicKey,
		apiConfig,
		opaqueConfig: config,
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
			EncodeHex(secureRandom(32)),
			EncodeHex(secureRandom(32)),
			EncodeHex(secureRandom(32)),
			EncodeHex(secureRandom(32)),
			EncodeHex(secureRandom(32)),
		].join('\n');
		etherAddresses = await Promise.all([registerAddress(users[1]), registerAddress(users[1])]);
	});
	afterAll(() => jest.resetAllMocks());

	it('verify messaging keys is correct', async () => {
		const data = [
			await lookupMessageKey(apiConfig, `${users[0].username}@mailchain.local`),
			await lookupMessageKey(apiConfig, `${users[1].username}@mailchain.local`),
		];

		expect(data[0].value).toEqual(EncodeHexZeroX(users[0].keyRing.accountMessagingKey().publicKey.bytes));
		expect(data[1].value).toEqual(EncodeHexZeroX(users[1].keyRing.accountMessagingKey().publicKey.bytes));
	});

	it('send message from user 1 to user 2', async () => {
		const payload = Buffer.from(message);
		headers = await getHeaders({ user: users[0], payload, signingKey: users[1].keyRing.accountMessagingKey() });

		await sendPayload(
			users[0].keyRing,
			apiConfig,
			{
				Headers: headers,
				Content: payload,
			},
			[`${users[1].username}@mailchain.local`],
		);
	});

	it('receive message from user 2 to user 1', async () => {
		const payload = Buffer.from(message);
		const receiver = new Receiver(apiConfig);

		const results = await receiver.getUndeliveredMessages(users[1].keyRing.accountMessagingKey());

		expect(results[0]).toBeDefined();
		expect(results[0].payload!.Content).toEqual(payload);
		expect(results[0].payload!.Headers).toEqual(headers);
	});

	it('receive message from user 2 to user 1 and acknowledge receiving', async () => {
		const receiver = new Receiver(apiConfig);

		let results = await receiver.getUndeliveredMessages(users[1].keyRing.accountMessagingKey());
		await confirmDelivery(apiConfig, users[1].keyRing.accountMessagingKey(), results[0].hash);

		results = await receiver.getUndeliveredMessages(users[1].keyRing.accountMessagingKey());
		expect(results[0]).toBeUndefined();
	});

	it('send ethereum  message from user 1 to user 2', async () => {
		const payload = Buffer.from(message);
		const etherAccountMessageKey = users[1].keyRing.addressMessagingKey(
			etherAddresses[0].addressBytes,
			protocols.ETHEREUM,
			1,
		);
		headers = await getHeaders({ user: users[0], payload, signingKey: etherAccountMessageKey });

		await sendPayload(
			users[0].keyRing,
			apiConfig,
			{
				Headers: headers,
				Content: payload,
			},
			[`${etherAddresses[0].address}@ethereum.mailchain.local`],
		);
	});
	it('receive ethereum message by user 2', async () => {
		const payload = Buffer.from(message);
		const receiver = new Receiver(apiConfig);
		const etherAccountMessageKey = users[1].keyRing.addressMessagingKey(
			etherAddresses[0].addressBytes,
			protocols.ETHEREUM,
			1,
		);
		let results = await receiver.getUndeliveredMessages(etherAccountMessageKey);

		expect(results[0]).toBeDefined();
		expect(results[0].payload!.Content).toEqual(payload);
		expect(results[0].payload!.Headers).toEqual(headers);
		await confirmDelivery(apiConfig, etherAccountMessageKey, results[0].hash);

		results = await receiver.getUndeliveredMessages(etherAccountMessageKey);
		expect(results[0]).toBeUndefined();
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
				return sendPayload(
					users[0].keyRing,
					apiConfig,
					{
						Headers: headersMultiple[index],
						Content: payload,
					},
					[`${it.address}@ethereum.mailchain.local`],
				);
			}),
		);
	});

	it('receive multiple ethereum messages from user 1 to user 2 on different ether addresses', async () => {
		const receiver = new Receiver(apiConfig);

		etherAddresses.map(async (it, index) => {
			const messagingKey = users[1].keyRing.addressMessagingKey(it.addressBytes, protocols.ETHEREUM, 1);
			const results = await receiver.getUndeliveredMessages(messagingKey);
			expect(results[index][0]).toBeDefined();
			expect(results[index][0].payload!.Content).toEqual(
				Buffer.from(`from ${users[0].username} to ${it.address}`),
			);
			expect(results[index][0].payload!.Headers).toEqual(headersMultiple[index]);

			await Promise.all(
				results.map(async (result) => {
					await confirmDelivery(apiConfig, messagingKey, result.hash);
				}),
			);

			const postConfirmedUndelivered = await receiver.getUndeliveredMessages(messagingKey);
			expect(postConfirmedUndelivered.length).toEqual(0);
		});
	});
});
