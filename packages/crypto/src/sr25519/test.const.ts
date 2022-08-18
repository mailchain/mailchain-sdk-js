import { SR25519PublicKey, SR25519PrivateKey } from './';

// Public
export const AliceSR25519PublicKeyBytes = new Uint8Array([
	0x16, 0x9a, 0x11, 0x72, 0x18, 0x51, 0xf5, 0xdf, 0xf3, 0x54, 0x1d, 0xd5, 0xc4, 0xb0, 0xb4, 0x78, 0xac, 0x1c, 0xd0,
	0x92, 0xc9, 0xd5, 0x97, 0x6e, 0x83, 0xda, 0xa0, 0xd0, 0x3f, 0x26, 0x62, 0xc,
]);
export const AliceSR25519PublicKey = new SR25519PublicKey(AliceSR25519PublicKeyBytes);

export const BobSR25519PublicKeyBytes = new Uint8Array([
	0x84, 0x62, 0x3e, 0x72, 0x52, 0xe4, 0x11, 0x38, 0xaf, 0x69, 0x4, 0xe1, 0xb0, 0x23, 0x4, 0xc9, 0x41, 0x62, 0x5f,
	0x39, 0xe5, 0x76, 0x25, 0x89, 0x12, 0x5d, 0xc1, 0xa2, 0xf2, 0xcf, 0x2e, 0x30,
]);
export const BobSR25519PublicKey = new SR25519PublicKey(BobSR25519PublicKeyBytes);

export const EveSR25519PublicKeyBytes = new Uint8Array([
	0x32, 0x11, 0x56, 0x19, 0x63, 0x3b, 0x1f, 0xf1, 0x56, 0x70, 0xef, 0xc1, 0x2c, 0x48, 0xf4, 0x74, 0x7a, 0x53, 0x8d,
	0xcf, 0x75, 0x8d, 0x2d, 0xe1, 0xe3, 0xf4, 0x6f, 0x0d, 0xf8, 0x14, 0x16, 0x14,
]);
export const EveSR25519PublicKey = new SR25519PublicKey(EveSR25519PublicKeyBytes);

// Private
export const AliceSR25519Seed = Uint8Array.from(
	Buffer.from('5c6d7adf75bda1180c225d25f3aa8dc174bbfb3cddee11ae9a85982f6faf791a', 'hex'),
);
export const AliceSR25519SecretBytes = Uint8Array.from(
	Buffer.from(
		'002779c6dac7a3c4a21253f37ef32f6c4ff8cdce7339d0cb2957eacc8cd652657479faa9c416436f20875ef58c43312760948df1bb283a436d1e4f18bffb1d4b',
		'hex',
	),
);
export const AliceSR25519PrivateKeyBytes = Uint8Array.from(
	Buffer.from(
		'002779c6dac7a3c4a21253f37ef32f6c4ff8cdce7339d0cb2957eacc8cd652657479faa9c416436f20875ef58c43312760948df1bb283a436d1e4f18bffb1d4b169a11721851f5dff3541dd5c4b0b478ac1cd092c9d5976e83daa0d03f26620c',
		'hex',
	),
);
export const AliceSR25519KeyPair = {
	publicKey: AliceSR25519PublicKey.bytes,
	secretKey: AliceSR25519SecretBytes,
};
export const AliceSR25519PrivateKey = SR25519PrivateKey.fromKeyPair(AliceSR25519KeyPair);

export const BobSR25519Seed = Uint8Array.from(
	Buffer.from('23b063a581fd8e5e847c4e2b9c494247298791530f5293be369e8bf23a45d2bd', 'hex'),
);
export const BobSR25519SecretBytes = Uint8Array.from(
	Buffer.from(
		'58618c0d0e5554e15ca74bc251475a4438dae7203dd399419cdf0fe2814fb85287cdfd5e9a6fa4f6ee0f253c0429b4efa83d0614ed848e05bd717004bcd0c263',
		'hex',
	),
);
export const BobSR25519PrivateKeyBytes = Uint8Array.from(
	Buffer.from(
		'58618c0d0e5554e15ca74bc251475a4438dae7203dd399419cdf0fe2814fb85287cdfd5e9a6fa4f6ee0f253c0429b4efa83d0614ed848e05bd717004bcd0c26384623e7252e41138af6904e1b02304c941625f39e5762589125dc1a2f2cf2e30',
		'hex',
	),
);
export const BobSR25519KeyPair = {
	publicKey: BobSR25519PublicKey.bytes,
	secretKey: BobSR25519SecretBytes,
};
export const BobSR25519PrivateKey = SR25519PrivateKey.fromKeyPair(BobSR25519KeyPair);

export const EveSR25519Seed = Uint8Array.from(
	Buffer.from('000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f', 'hex'),
);
export const EveSR25519SecretBytes = Uint8Array.from(
	Buffer.from(
		'589b458bc1bf4544633cd42533dbcc976f79f70fdc8239d56403fc404a8b777b457617125fea58be97725905fbf6eb91598b6b7c618229e44d87e339bf603364',
		'hex',
	),
);
export const EveSR25519PrivateKeyBytes = Uint8Array.from(
	Buffer.from(
		'589b458bc1bf4544633cd42533dbcc976f79f70fdc8239d56403fc404a8b777b457617125fea58be97725905fbf6eb91598b6b7c618229e44d87e339bf60336432115619633b1ff15670efc12c48f4747a538dcf758d2de1e3f46f0df8141614',
		'hex',
	),
);
export const EveSR25519KeyPair = {
	publicKey: EveSR25519PublicKey.bytes,
	secretKey: EveSR25519SecretBytes,
};
export const EveSR25519PrivateKey = SR25519PrivateKey.fromKeyPair(EveSR25519KeyPair);
