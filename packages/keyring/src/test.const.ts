import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from './keyring';

export const aliceKeyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
export const bobKeyRing = KeyRing.fromPrivateKey(BobED25519PrivateKey);
