import { SignerWithPublicKey } from '@mailchain/crypto';
import { Distribution, MailData, Payload } from '../../transport';
import { ResolvedAddress } from '../../messagingKeys';
import { createMimeMessage } from '../../formatters/generate';
import { createPayload } from '../payload';

export async function createMailPayloads(
	senderMessagingKey: SignerWithPublicKey,
	resolvedAddresses: Map<string, ResolvedAddress>,
	mailData: MailData,
): Promise<{
	original: Payload;
	distributions: Distribution[];
}> {
	const message = await createMimeMessage(mailData, resolvedAddresses);

	const original = await createPayload(senderMessagingKey, Buffer.from(message.original), 'message/x.mailchain');
	const visibleRecipientsPayload = await createPayload(
		senderMessagingKey,
		Buffer.from(message.visibleRecipients),
		'message/x.mailchain',
	);
	const blindRecipients = await Promise.all(
		message.blindRecipients.map(async ({ recipient, content }) => ({
			recipients: [recipient.address],
			payload: await createPayload(senderMessagingKey, Buffer.from(content), 'message/x.mailchain'),
		})),
	);

	return {
		original,
		distributions: [
			{
				recipients: [
					...mailData.recipients.map((x) => x.address),
					...mailData.carbonCopyRecipients.map((x) => x.address),
				],
				payload: visibleRecipientsPayload,
			},
			...blindRecipients,
		],
	};
}
