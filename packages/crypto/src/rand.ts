import { randomAsU8a } from '@polkadot/util-crypto';

export type RandomFunction = (len?: number) => Uint8Array;
export const SecureRandom = randomAsU8a;
