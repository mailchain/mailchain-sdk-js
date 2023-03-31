import { KindNaClSecretKey, SignerWithPublicKey } from '@mailchain/crypto';
import { EncodingTypes } from '@mailchain/encoding';
import { MailDistribution, MailData, Payload } from '../../transport';
import { ResolvedAddress } from '../../messagingKeys';
import { createMimeMessage } from '../../formatters/generate';

export async function createMailPayloads(
	senderMessagingKey: SignerWithPublicKey,
	resolvedAddresses: Map<string, ResolvedAddress>,
	mailData: MailData,
): Promise<{
	original: Payload;
	distributions: MailDistribution[];
}> {
	const message = await createMimeMessage(mailData, resolvedAddresses);

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
