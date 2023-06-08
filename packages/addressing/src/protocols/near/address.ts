import { isHex } from '@mailchain/encoding';

export function validateNearAccountId(accountId: string) {
	return validateNearImplicitAccount(accountId) || validateNearNamedAccount(accountId);
}

export function validateNearImplicitAccount(address: string) {
	return address.length == 64 && isHex(address);
}

export function validateNearNamedAccount(address: string) {
	return (
		address.length >= 2 &&
		address.length <= 64 &&
		/^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(address)
	);
}
