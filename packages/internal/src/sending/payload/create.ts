import { KindNaClSecretKey, SignerWithPublicKey } from '@mailchain/crypto';
import { EncodingTypes } from '@mailchain/encoding';
import isArrayBuffer from 'lodash/isArrayBuffer.js';
import { PayloadHeaders } from '../../transport/payload/headers';
import { ContentType, Payload } from '../../transport';

export async function createPayload<C extends ContentType>(
	signerMessagingKey: SignerWithPublicKey,
	content: Buffer | Uint8Array,
	contentType: C,
	pluginHeaders?: Record<string, unknown>,
): Promise<Payload<PayloadHeaders<C>>> {
	return {
		Headers: {
			Origin: signerMessagingKey.publicKey,
			ContentSignature: await signerMessagingKey.sign(content),
			Created: new Date(),
			ContentLength: content.length,
			ContentType: contentType,
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
			PluginHeaders: pluginHeaders,
		},
		Content: isArrayBuffer(content) ? Buffer.from(content) : content,
	};
}
