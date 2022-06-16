import { EncodeBase58, EncodingTypes } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { SecureRandom } from '@mailchain/crypto';
import { getOpaqueConfig, OpaqueID } from '@cloudflare/opaque-ts';
import { lookupMessageKey } from '@mailchain/api/identityKeys';
import { KindNaClSecretKey } from '@mailchain/crypto/cipher';
import { Configuration, ConfigurationParameters } from '../api';
import { OpaqueConfig } from '../types';
import { Register } from '../auth/register';
import { EncodeHexZeroX, EncodeHex } from '../../../encoding/src/hex';
import { sendPayload } from '../transport/send';
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
			[`${users[1].username}@mailchain.local`],
		);
	});

	it('receive message from user 2 to user 1', async () => {
		const payload = Buffer.from(message);
		const receiver = new Receiver(apiConfig);

		const results = await receiver.pullNewMessages(users[1].keyRing.accountMessagingKey());

		expect(results[0]).toBeDefined();
		expect(results[0]!.Content).toEqual(payload);
		expect(results[0]!.Headers).toEqual(headers);
	});
});
