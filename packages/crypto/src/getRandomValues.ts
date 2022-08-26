import { randomBytes } from 'crypto';

/**
 * @param {TypedArray} ta
 * @returns {(df: DataView, i: number) => number}
 */
const getMethod = (ta) => {
	if (ta instanceof Int8Array) return (df, i) => df.getInt8(i);
	if (ta instanceof Uint8Array) return (df, i) => df.getUint8(i);
	if (ta instanceof Uint8ClampedArray) return (df, i) => df.getUint8(i);
	if (ta instanceof Int16Array) return (df, i) => df.getInt16(i);
	if (ta instanceof Uint16Array) return (df, i) => df.getUint16(i);
	if (ta instanceof Int32Array) return (df, i) => df.getInt32(i);
	if (ta instanceof Uint32Array) return (df, i) => df.getUint32(i);
	if (ta instanceof Float32Array) return (df, i) => df.getFloat32(i);
	if (ta instanceof Float64Array) return (df, i) => df.getFloat64(i);
	if (ta instanceof BigInt64Array) return (df, i) => df.getBigInt64(i);
	if (ta instanceof BigUint64Array) return (df, i) => df.getBigUint64(i);
	throw Error('Unknown typed array');
};

/**
 * @typedef {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} TypedArray
 */

/**
 * Polyfill for `crypto.getRandomValues` for node, using node's `crypto` module.
 * @param {TypedArray} typedArray A typed array to be filled with random data.
 * @returns {TypedArray} The same typed array filled with random data.
 */
export const getRandomValues = (typedArray) => {
	const { BYTES_PER_ELEMENT, length } = typedArray;
	const totalBytes = BYTES_PER_ELEMENT * length;
	const { buffer } = randomBytes(totalBytes);
	const dataView = new DataView(buffer);
	const method = getMethod(typedArray);
	for (let byteIndex = 0; byteIndex < totalBytes; byteIndex += BYTES_PER_ELEMENT) {
		const integer = method(dataView, byteIndex);
		const arrayIndex = byteIndex / BYTES_PER_ELEMENT;
		typedArray[arrayIndex] = integer;
	}
	return typedArray;
};
