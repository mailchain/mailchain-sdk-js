import { AliceED25519PrivateKey, AliceED25519PublicKey } from '../ed25519/test.const';
import { signRawEd25519, verifyRawEd25519 } from './raw_ed25119';

describe('Raw EE25519 sign/verify', () => {
	it('should sign with ED25519', async () => {
		const message = Buffer.from('msg', 'utf-8');
		const expectedSignature = Buffer.from('signed', 'utf-8');
		const mockSign = jest.spyOn(AliceED25519PrivateKey, 'sign');
		mockSign.mockReturnValue(Promise.resolve(expectedSignature));

		const actualSignature = await signRawEd25519(AliceED25519PrivateKey, message);

		expect(actualSignature).toEqual(expectedSignature);
		expect(mockSign.mock.calls[0][0]).toEqual(message);
	});

	it('should verify with ED25519', async () => {
		const message = Buffer.from('msg', 'utf-8');
		const signature = Buffer.from('signed', 'utf-8');
		const mockVerify = jest.spyOn(AliceED25519PublicKey, 'verify');
		mockVerify.mockReturnValue(Promise.resolve(true));

		const valid = await verifyRawEd25519(AliceED25519PublicKey, message, signature);

		expect(valid).toEqual(true);
		expect(mockVerify.mock.calls[0]).toEqual([message, signature]);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});
});
