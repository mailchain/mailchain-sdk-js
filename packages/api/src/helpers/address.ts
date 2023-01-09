import { decode } from '@mailchain/encoding';
import { Address } from '../api';

export const getAddressFromApiResponse = (address: Address) => {
	return decode(address.encoding, address.value);
};
