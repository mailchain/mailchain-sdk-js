import { EncodingTypes } from '@mailchain/encoding';
import { Decode } from '@mailchain/encoding/encoding';
import { protocols } from '@mailchain/internal';
import { formatMailLike } from './formatMailLike';

const casesOnlyProtocol = [
	['0x1337', protocols.ETHEREUM, '0x1337@ethereum.mailchain'],
	['1337', protocols.ALGORAND, '1337@algorand.mailchain'],
	['1337', protocols.SUBSTRATE, '1337@substrate.mailchain'],
] as const;

const casesOnlyProtocolUint = [
	[Decode(EncodingTypes.Hex, '1337'), protocols.ETHEREUM, '0x1337@ethereum.mailchain'],
	[Decode(EncodingTypes.Base58, '1337'), protocols.SUBSTRATE, '1337@substrate.mailchain'],
] as const;

describe('formatMailLike', () => {
	test.each(casesOnlyProtocol)(
		'given %p as address and %p as protocol, returns %p',
		(address, protocol, expectedMail) => {
			const result = formatMailLike(address, protocol);

			expect(result).toEqual(expectedMail);
		},
	);

	test.each(casesOnlyProtocolUint)(
		'given %p as address and %p as protocol, returns %p',
		(address, protocol, expectedMail) => {
			const result = formatMailLike(address, protocol);

			expect(result).toEqual(expectedMail);
		},
	);
});
