import { AliceSECP256K1PrivateKey, AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import {
	AliceSECP256K1PublicAddress,
	BobSECP256K1PublicAddress,
} from '@mailchain/addressing/protocols/ethereum/test.const';
import { getMessageHash } from '../eth_personal';
import { ethereumPublicKeyFromSignature } from './ethereum';
describe('publicKey', () => {
	it('should extract public key from signature', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const messageHash = await getMessageHash(msg);

		const signedMsg = await AliceSECP256K1PrivateKey.sign(messageHash);

		const publicKey = await ethereumPublicKeyFromSignature(msg, signedMsg, AliceSECP256K1PublicAddress);

		expect(publicKey).toEqual(AliceSECP256K1PublicKey);
	});

	it('should fail because of incorrect address', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const messageHash = await getMessageHash(msg);
		const signedMsg = await AliceSECP256K1PrivateKey.sign(messageHash);

		expect(() => ethereumPublicKeyFromSignature(msg, signedMsg, BobSECP256K1PublicAddress)).rejects.toThrow();
	});

	it('should failed because message changed', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const messageHash = await getMessageHash(msg);
		const signedMsg = await AliceSECP256K1PrivateKey.sign(messageHash);

		const anotherMessageHash = await getMessageHash(Uint8Array.from([2, 3, 4, 5, 6]));

		expect(() =>
			ethereumPublicKeyFromSignature(anotherMessageHash, signedMsg, AliceSECP256K1PublicAddress),
		).rejects.toThrow();
	});

	it('should failed because signature changed', async () => {
		const msg = Uint8Array.from([1, 2, 3, 4, 5]);
		const messageHash = await getMessageHash(msg);
		const signedMsg = await AliceSECP256K1PrivateKey.sign(messageHash);
		signedMsg[0] += 1;
		expect(() => ethereumPublicKeyFromSignature(msg, signedMsg, AliceSECP256K1PublicAddress)).rejects.toThrow();
	});
});
