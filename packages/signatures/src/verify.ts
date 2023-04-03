import { PublicKey } from '@mailchain/crypto';
import { decodeUtf8 } from '@mailchain/encoding';
import { KindEthereumPersonalMessage, KindRawED25519, KindTezos } from './consts';
import { verifyEthereumPersonalMessage } from './eth_personal';
import { verifyRawEd25519 } from './raw_ed25519';
import { verifyTezosSignedMessage } from './tezos_micheline';

export function verify(
	signingMethod: string,
	verifyingKey: PublicKey,
	message: string,
	signature: Uint8Array,
): Promise<boolean> {
	switch (signingMethod) {
		case KindEthereumPersonalMessage:
			return verifyEthereumPersonalMessage(verifyingKey, decodeUtf8(message), signature);
		case KindRawED25519:
			return verifyRawEd25519(verifyingKey, decodeUtf8(message), signature);
		case KindTezos:
			return verifyTezosSignedMessage(verifyingKey, message, signature);
		default:
			throw new Error();
	}
}
