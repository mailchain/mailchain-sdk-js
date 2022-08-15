import { KindNaClSecretKey, SignerWithPublicKey } from '@mailchain/crypto';
import { EncodingTypes } from '@mailchain/encoding';
import { createMimeMessage } from '@mailchain/sdk/internal/formatters/generate';
import { MailData } from '@mailchain/sdk/internal/formatters/types';
import { Payload } from '@mailchain/sdk/internal/transport/payload/content/payload';
import { MailAddress } from '../../formatters/types';

export type Distribution = {
	recipients: MailAddress[];
	payload: Payload;
};

export async function createMailPayloads(
	senderMessagingKey: SignerWithPublicKey,
	mailData: MailData,
): Promise<{
	original: Payload;
	distributions: Distribution[];
}> {
	const message = createMimeMessage(mailData);

	const original = await createMailPayload(senderMessagingKey, message.original);
	const visibleRecipientsPayload = await createMailPayload(senderMessagingKey, message.visibleRecipients);
	const blindRecipients = await Promise.all(
		message.blindRecipients.map(async ({ recipient, content }) => ({
			recipients: [recipient],
			payload: await createMailPayload(senderMessagingKey, content),
		})),
	);

	return {
		original,
		distributions: [
			{
				recipients: [...mailData.recipients, ...mailData.carbonCopyRecipients],
				payload: visibleRecipientsPayload,
			},
			...blindRecipients,
		],
	};
}

export async function createMailPayload(
	senderMessagingKey: SignerWithPublicKey,
	contentPayload: string,
): Promise<Payload> {
	const contentBuffer = Buffer.from(contentPayload);
	return {
		Headers: {
			Origin: senderMessagingKey.publicKey,
			ContentSignature: await senderMessagingKey.sign(contentBuffer),
			Created: new Date(),
			ContentLength: contentBuffer.length,
			ContentType: 'message/x.mailchain',
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
		},
		Content: contentBuffer,
	};
}
