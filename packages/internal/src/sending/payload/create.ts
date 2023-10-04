import { KindNaClSecretKey, SignerWithPublicKey } from '@mailchain/crypto';
import { EncodingTypes } from '@mailchain/encoding';
import isArrayBuffer from 'lodash/isArrayBuffer';
import { PayloadHeaders } from '../../transport/payload/headers';
import { ContentType, Payload } from '../../transport';

export async function createPayload<C extends ContentType>(
	signerMessagingKey: SignerWithPublicKey,
	content: Buffer | Uint8Array,
	contentType: C,
): Promise<Payload<{ ContentType: C } & PayloadHeaders>> {
	return {
		Headers: {
			Origin: signerMessagingKey.publicKey,
			ContentSignature: await signerMessagingKey.sign(content),
			Created: new Date(),
			ContentLength: content.length,
			ContentType: contentType,
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
		},
		Content: isArrayBuffer(content) ? Buffer.from(content) : content,
	};
}
