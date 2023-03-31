import { BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { MailerProof } from '@mailchain/signatures';
import { createMailerProofBuffer, parseMailerProofFromJSON } from './mailerProof';

describe('round trip', () => {
	it('example payload', () => {
		const original: MailerProof = {
			params: {
				expires: new Date('2022-06-06'),
				mailerMessagingKey: BobED25519PublicKey,
				authorContentSignature: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
			},
			signature: new Uint8Array([0x0a, 0xb, 0xc, 0xd]),
			version: '1.0',
		};

		const bufferedContent = createMailerProofBuffer(original);

		const actual = parseMailerProofFromJSON(bufferedContent);

		expect(actual).toEqual(original);
	});
});
