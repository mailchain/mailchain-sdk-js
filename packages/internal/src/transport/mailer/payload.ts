import { KindNaClSecretKey, SignerWithPublicKey } from '@mailchain/crypto';
import { EncodingTypes } from '@mailchain/encoding';
import { Payload } from '../payload';
import { PayloadHeaders } from '../payload/headers';
import { createContentBuffer, MailerContent } from './content';

export type MailerHeaders = PayloadHeaders<'message/x.mailchain-mailer'>;
export type MailerPayload = Payload<MailerHeaders>;

export function isMailerHeaders(headers: PayloadHeaders): headers is MailerHeaders {
	return headers.ContentType === 'message/x.mailchain-mailer' && !Object.hasOwn(headers, 'MailerContent');
}

export function isMailerPayload(payload: Payload): payload is MailerPayload {
	return isMailerHeaders(payload.Headers);
}

export type ResolvedMailerHeaders = { MailerContent: MailerContent } & MailerHeaders;
export type ResolvedMailerPayload = Payload<ResolvedMailerHeaders>;

export function isResolvedMailerHeaders(headers: PayloadHeaders): headers is ResolvedMailerHeaders {
	return headers.ContentType === 'message/x.mailchain-mailer' && Object.hasOwn(headers, 'MailerContent');
}

export function isResolvedMailerPayload(payload: Payload): payload is ResolvedMailerPayload {
	return isResolvedMailerHeaders(payload.Headers);
}

export async function createMailerPayload(
	mailerMessagingKey: SignerWithPublicKey,
	mailerContent: MailerContent,
): Promise<MailerPayload> {
	const mailerContentBuffer = Buffer.from(createContentBuffer(mailerContent));
	return {
		Headers: {
			Origin: mailerMessagingKey.publicKey,
			ContentSignature: await mailerMessagingKey.sign(mailerContentBuffer),
			Created: new Date(),
			ContentLength: mailerContentBuffer.length,
			ContentType: 'message/x.mailchain-mailer',
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
		},
		Content: mailerContentBuffer,
	};
}
