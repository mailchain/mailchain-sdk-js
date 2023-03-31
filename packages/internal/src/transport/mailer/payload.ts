import { KindNaClSecretKey, SignerWithPublicKey } from '@mailchain/crypto';
import { EncodingTypes } from '@mailchain/encoding';
import { Payload } from '../payload';
import { createContentBuffer, MailerContent } from './content';

export type ReadonlyMailerPayload = {
	MailerContent: MailerContent;
	Headers: {
		ContentType: 'message/x.mailchain-mailer';
	} & Payload['Headers'];
} & Payload;

export async function createMailerPayload(
	mailerMessagingKey: SignerWithPublicKey,
	contentPayload: MailerContent,
): Promise<Payload> {
	const contentBuffer = Buffer.from(createContentBuffer(contentPayload));
	return {
		Headers: {
			Origin: mailerMessagingKey.publicKey,
			ContentSignature: await mailerMessagingKey.sign(contentBuffer),
			Created: new Date(),
			ContentLength: contentBuffer.length,
			ContentType: 'message/x.mailchain-mailer',
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
		},
		Content: contentBuffer,
	};
}
