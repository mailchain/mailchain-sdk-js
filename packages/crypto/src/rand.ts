import { randomBytes } from '@noble/hashes/utils';

export type RandomFunction = (len?: number) => Uint8Array;
export const secureRandom = randomBytes;
