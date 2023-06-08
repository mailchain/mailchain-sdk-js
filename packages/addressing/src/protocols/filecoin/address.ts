import { isBase32 } from '@mailchain/encoding';
import { FILECOIN_PREFIX_F4_ETHEREUM, FILECOIN_PREFIX_T4_ETHEREUM } from './const';
import { convertFilDelegatedAddressToEthAddress } from './delegatedAddress';

export function validateFilecoinAddress(address: string): boolean {
	if (address.length < 42 && address.length > 49) {
		return false;
	} else if (!address.startsWith(FILECOIN_PREFIX_F4_ETHEREUM) && !address.startsWith(FILECOIN_PREFIX_T4_ETHEREUM)) {
		return false;
	} else if (!isBase32(address.slice(4))) {
		return false;
	}

	return convertFilDelegatedAddressToEthAddress(address).error === undefined;
}
