import { isNameServiceAddress, isSameNameServiceAddress } from './nameServiceAddress';
import { MailchainAddress } from '.';

export function isSameAddress(a: MailchainAddress, b: MailchainAddress) {
	if (isNameServiceAddress(a) && isNameServiceAddress(b)) return isSameNameServiceAddress(a, b);
	return false;
}
