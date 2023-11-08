import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { createPayload } from './create';

describe('createPayload', () => {
	const content = Buffer.from('content');

	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date('2022-06-06'));
	});
	afterAll(() => {
		jest.useRealTimers();
	});
	it('should create a payload - alice key', async () => {
		expect(
			await createPayload(
				AliceED25519PrivateKey,
				content,
				'application/vnd.mailchain.verified-credential-request',
				{ plugin: { value: 'value' } },
			),
		).toMatchSnapshot();
	});

	it('should create a payload - bob key', async () => {
		expect(
			await createPayload(
				BobED25519PrivateKey,
				content,
				'application/vnd.mailchain.verified-credential-request',
				{ plugin: { value: 'value' } },
			),
		).toMatchSnapshot();
	});
});
