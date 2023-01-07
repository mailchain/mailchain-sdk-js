import { PublicKey } from '@mailchain/crypto';
import { KindEthereumPersonalMessage, KindRawED25519 } from './consts';
import { verifyEthereumPersonalMessage } from './eth_personal';
import { verifyRawEd25519 } from './raw_ed25519';

export function verify(
	signingMethod: string,
	verifyingKey: PublicKey,
	message: Uint8Array,
	signature: Uint8Array,
): Promise<boolean> {
	switch (signingMethod) {
		case KindEthereumPersonalMessage:
			return verifyEthereumPersonalMessage(verifyingKey, Buffer.from(message), signature);
		case KindRawED25519:
			return verifyRawEd25519(verifyingKey, message, signature);
		default:
			throw new Error();
	}
}