import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { EncodeBase58, EncodeBase64, EncodingTypes } from '@mailchain/encoding';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { getSettings, setSetting } from '../user/settings';
import { Configuration, ConfigurationParameters } from '../api';
import { BobED25519PrivateKey } from '../../../crypto/src/ed25519/test.const';
import { SecureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { getOpaqueConfig, OpaqueID } from '@cloudflare/opaque-ts';
import { OpaqueConfig } from '../types';
import { Register } from '../auth/register';
import { lookupMessageKey } from '@mailchain/api/identityKeys';
import { EncodeHexZeroX, EncodeHex } from '../../../encoding/src/hex';
import { sendPayload } from '../transport/send';
import { KindNaClSecretKey } from '@mailchain/crypto/cipher';
import { Receiver } from '../transport/receive';
import { PayloadHeaders } from '../transport/content/headers';
jest.setTimeout(60000);

const params = getOpaqueConfig(OpaqueID.OPAQUE_P256);

const config = {
	parameters: params,
	serverIdentity: 'Mailchain',
	context: 'MailchainAuthentication',
} as OpaqueConfig;

const apiConfig = new Configuration({ basePath: 'http://localhost:8080' } as ConfigurationParameters);
const registerRandomUser = async () => {
	const username = EncodeBase58(SecureRandom(8)).toLowerCase();
	const seed = SecureRandom(32);

	const identityKey = ED25519PrivateKey.FromSeed(seed);
	const keyRing = KeyRing.FromPrivateKey(identityKey);

	const registrationResponse = await Register({
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

describe('SendAndReceiveMessage', () => {
	let users: {
		username: string;
		keyRing: KeyRing;
	}[];
	let message: string;
	let headers: PayloadHeaders;

	beforeAll(async () => {
		users = [await registerRandomUser(), await registerRandomUser()];
		message = [
			EncodeHex(SecureRandom(32)),
			EncodeHex(SecureRandom(32)),
			EncodeHex(SecureRandom(32)),
			EncodeHex(SecureRandom(32)),
			EncodeHex(SecureRandom(32)),
		].join('\n');
	});
	afterAll(() => jest.resetAllMocks());

	it('verify messaging keys is correct', async () => {
		const data = [
			await lookupMessageKey(apiConfig, `${users[0].username}@mailchain.local`),
			await lookupMessageKey(apiConfig, `${users[1].username}@mailchain.local`),
		];

		expect(data[0].value).toEqual(EncodeHexZeroX(users[0].keyRing.accountMessagingKey().publicKey.Bytes));
		expect(data[1].value).toEqual(EncodeHexZeroX(users[1].keyRing.accountMessagingKey().publicKey.Bytes));
	});

	it('send message from user 1 to user 2', async () => {
		const payload = Buffer.from(message);
		headers = {
			Origin: users[0].keyRing.accountMessagingKey().publicKey,
			ContentSignature: await users[1].keyRing.accountMessagingKey().sign(payload),
			Created: new Date(),
			ContentLength: payload.length,
			ContentType: 'message/x.mailchain',
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
		};
		await sendPayload(
			users[0].keyRing,
			apiConfig,
			{
				Headers: headers,
				Content: payload,
			},
			[{ address: `${users[1].username}@mailchain.local`, protocol: 'mailchain' }],
		);
	});

	it('receive message from user 2 to user 1', async () => {
		// expect.assertions(3);
		const payload = Buffer.from(message);
		const receiver = new Receiver(apiConfig);

		const results = await receiver.pullNewMessages(users[1].keyRing.accountMessagingKey());

		expect(results[0]).toBeDefined();
		expect(results[0]!.Content).toEqual(payload);
		expect(results[0]!.Headers).toEqual(headers);
	});
});
