import { randomAsU8a } from '@polkadot/util-crypto/random';

export type RandomFunction = (len?: number) => Uint8Array;
export const secureRandom = randomAsU8a;
