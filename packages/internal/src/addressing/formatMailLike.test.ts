import { EncodingTypes } from '@mailchain/encoding';
import { Decode } from '@mailchain/encoding/encoding';
import { protocols } from '@mailchain/internal';
import { formatMailLike } from './formatMailLike';

const casesOnlyProtocol = [
	['0x1337', protocols.ETHEREUM, 'mailchain.local', '0x1337@ethereum.mailchain.local'],
	['1337', protocols.ALGORAND, 'mailchain.com', '1337@algorand.mailchain.com'],
	['1337', protocols.SUBSTRATE, 'mailchain.dev', '1337@substrate.mailchain.dev'],
] as const;

const casesOnlyProtocolUint = [
	[Decode(EncodingTypes.Hex, '1337'), protocols.ETHEREUM, 'mailchain.local', '0x1337@ethereum.mailchain.local'],
	[Decode(EncodingTypes.Base58, '1337'), protocols.SUBSTRATE, 'mailchain.dev', '1337@substrate.mailchain.dev'],
] as const;

describe('formatMailLike', () => {
	test.each(casesOnlyProtocol)(
		'given %p as address and %p as protocol, returns %p',
		(address, protocol, mailchainDomain, expectedMail) => {
			const result = formatMailLike(address, protocol, mailchainDomain);

			expect(result).toEqual(expectedMail);
		},
	);

	test.each(casesOnlyProtocolUint)(
		'given %p as address and %p as protocol, returns %p',
		(address, protocol, mailchainDomain, expectedMail) => {
			const result = formatMailLike(address, protocol, mailchainDomain);

			expect(result).toEqual(expectedMail);
		},
	);
});
