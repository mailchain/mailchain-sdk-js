import { decodeBase58, encodeBase58 } from './base58';
import { decodeBase58Check, encodeBase58Check } from './base58Check';
import { decodeHex, encodeHex } from './hex';

const tests = {
	valid: [
		{
			encoded: '12R82ZZG6NVmpnP8KwRJGt8tRdCU2',
			encodedWithChecksum: '1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i',
			payload: '0065a16059864a2fdbc7c99a4723a8395bc6f188eb',
		},
		{
			encoded: 'LTnVPLdqNPxVqNdmzxqqYVNUzpVk',
			encodedWithChecksum: '3CMNFxN1oHBc4R1EpboAL5yzHGgE611Xou',
			payload: '0574f209f6ea907e2ea48f74fae05782ae8a665257',
		},
		{
			encoded: '7r3sHJFoZy8Vk1WBtAjUptwsVbYXF',
			encodedWithChecksum: 'mo9ncXisMeAoXwqcV5EWuyncbmCcQN4rVs',
			payload: '6f53c0307d6851aa0ce7825ba883c6bd9ad242b486',
		},
		{
			encoded: 'D5RKPQ9AGVgxhXBEwoBZ4w2GRfdYA',
			encodedWithChecksum: '2N2JD6wb56AfK4tfmM6PwdVmoYk2dCKf4Br',
			payload: 'c46349a418fc4578d10a372b54b45c280cc8c4382f',
		},
		{
			encoded: 'fJQ3WZGGdLjkLuqcZTTBn97SMsxxEZ5oZAXw1GYjCFaK2',
			encodedWithChecksum: '5Kd3NBUAdUnhyzenEwVLy9pBKxSwXvE9FMPyR4UKZvpe6E3AgLr',
			payload: '80eddbdc1168f1daeadbd3e44c1e3f8f5a284c2029f78ad26af98583a499de5b19',
		},
		{
			encoded: '3uGcbC8BDR13NMw1BoXyBLzypX3hr3tHgFzGrAaqSWGp2Yp',
			encodedWithChecksum: 'Kz6UJmQACJmLtaQj5A3JAge4kVTNQ8gbvXuwbmCj7bsaabudb3RD',
			payload: '8055c9bccb9ed68446d1b75273bbce89d7fe013a8acd1625514420fb2aca1a21c401',
		},
	],
	invalidChecksum: [
		{
			encodedWithChecksum: 'Z9inZq4e2HGQRZQezDjFMmqgUE8NwMRok',
			exception: 'Invalid checksum',
		},
		{
			encodedWithChecksum: '3HK7MezAm6qEZQUMPRf8jX7wDv6zig6Ky8',
			exception: 'Invalid checksum',
		},
		{
			encodedWithChecksum: '3AW8j12DUk8mgA7kkfZ1BrrzCVFuH1LsXS',
			exception: 'Invalid checksum',
		},
		{
			encodedWithChecksum: '#####',
			exception: 'Non-base58 character',
		},
	],
};

test.each(tests.valid)('valid $encoded-$payload', ({ encoded, encodedWithChecksum, payload }) => {
	expect(encodeBase58(decodeHex(payload))).toEqual(encoded);
	expect(encodeBase58Check(decodeHex(payload))).toEqual(encodedWithChecksum);

	expect(encodeHex(decodeBase58(encoded))).toEqual(payload);
	expect(encodeHex(decodeBase58Check(encodedWithChecksum))).toEqual(payload);
});

test.each(tests.invalidChecksum)('$exception-$encodedWithChecksum', ({ encodedWithChecksum }) => {
	expect(() => decodeBase58Check(encodedWithChecksum)).toThrowError();
});
