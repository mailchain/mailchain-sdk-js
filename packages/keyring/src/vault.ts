let privateKey: Uint8Array = new Uint8Array();

export function setVault(value: Uint8Array) {
	privateKey = value;
}

export function getVault(): Uint8Array {
	return privateKey;
}
