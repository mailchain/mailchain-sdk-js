import { AliceED25519PublicKey } from '../../ed25519/test.const';
import { AliceUnknownPublicKey } from '../../testing/public';
import { ED25519KeyExchange } from './ed25519';
import { fromPublicKey } from './';

describe('FromPublicKey', () => {
	const tests = [
		{
			name: 'creates-ed25519-key-exchange',
			key: AliceED25519PublicKey,
			expected: ED25519KeyExchange,
			shouldThrow: false,
		},
		{
			name: 'fails-to-creates-with-unknown-key',
			key: AliceUnknownPublicKey,
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				fromPublicKey(test.key);
			}).toThrow();
		} else {
			expect(fromPublicKey(test.key).constructor).toEqual(test.expected);
		}
	});
});
