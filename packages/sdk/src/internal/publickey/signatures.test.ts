import { AliceSECP256K1PrivateKey, AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import {
	AliceSECP256K1PublicAddress,
	BobSECP256K1PublicAddress,
} from '@mailchain/addressing/protocols/ethereum/test.const';
import { publicKeyFromSignature } from './signatures';
describe('publicKey', () => {
	it('should extract public key from signature', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const signedMsg = await AliceSECP256K1PrivateKey.sign(msg);

		const publicKey = await publicKeyFromSignature(msg, signedMsg, AliceSECP256K1PublicAddress);

		expect(publicKey).toEqual(AliceSECP256K1PublicKey);
	});

	it('should fail because of incorrect address', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const signedMsg = await AliceSECP256K1PrivateKey.sign(msg);

		expect(() => publicKeyFromSignature(msg, signedMsg, BobSECP256K1PublicAddress)).rejects.toThrow();
	});

	it('should failed because message changed', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const signedMsg = await AliceSECP256K1PrivateKey.sign(msg);

		expect(() =>
			publicKeyFromSignature(Uint8Array.from([2, 3, 4, 5, 6]), signedMsg, AliceSECP256K1PublicAddress),
		).rejects.toThrow();
	});

	it('should failed because signature changed', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const signedMsg = await AliceSECP256K1PrivateKey.sign(msg);
		signedMsg[0] += 1;
		expect(() => publicKeyFromSignature(msg, signedMsg, AliceSECP256K1PublicAddress)).rejects.toThrow();
	});
});
