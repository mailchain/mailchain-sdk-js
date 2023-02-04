import { verifyMailerProof } from '@mailchain/signatures';
import axios, { AxiosInstance } from 'axios';
import { decodeBase64, encodeUtf8 } from '@mailchain/encoding';
import { MailerContent, MailerData, parseMailerContentFromJSON, Payload } from '../../transport';
import { ReadonlyMailerPayload } from '../../transport/mailer/payload';
import { Configuration } from '../../..';
import { createMimeMessage } from '../../formatters/generate';
import { MailerAuthorVerifier } from './author';

export class MailerContentResolver {
	constructor(private readonly axiosInstance: AxiosInstance, private readonly sender: MailerAuthorVerifier) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		return new MailerContentResolver(axiosInstance, MailerAuthorVerifier.create(configuration));
	}

	async get(payload: Payload): Promise<ReadonlyMailerPayload> {
		if (payload.Headers.ContentType !== 'message/x.mailchain-mailer') {
			throw new Error('invalid content type');
		}

		const mailerContent: MailerContent = parseMailerContentFromJSON(payload.Content.toString());

		if (!verifyMailerProof(mailerContent.authorMessagingKey, mailerContent.mailerProof)) {
			throw new Error('invalid mailer proof');
		}

		const response = await this.axiosInstance.get(mailerContent.contentUri, {
			responseType: 'arraybuffer',
		});

		const decodedData = decodeBase64(response.data);

		if (
			!mailerContent.authorMessagingKey.verify(
				decodedData,
				mailerContent.mailerProof.params.authorContentSignature,
			)
		) {
			throw new Error('invalid content signature');
		}

		const parsedMailerData: MailerData = JSON.parse(encodeUtf8(decodedData));

		const processedContent = await processContent(mailerContent, parsedMailerData);

		const mailerPayload = {
			...payload,
			Content: Buffer.from(processedContent, 'utf8'),
			MailerContent: mailerContent,
		} as ReadonlyMailerPayload;

		const senderOwnsFromAddress = await this.sender.verifyAuthorOwnsFromAddress(
			payload,
			Buffer.from(processedContent),
		);

		// done here to check that the from address isn't manipulated during rendering
		if (!senderOwnsFromAddress) {
			throw new Error('sender does not match from address');
		}

		return mailerPayload;
	}
}

async function processContent(mailerContent: MailerContent, mailerData: MailerData) {
	// TODO: interpolate content variables
	const { original } = await createMimeMessage(
		{
			blindCarbonCopyRecipients: [],
			carbonCopyRecipients: [],
			date: mailerContent.date,
			from: mailerContent.authorMailAddress,
			id: mailerContent.messageId,
			message: mailerData.html,
			plainTextMessage: mailerData.plainTextMessage,
			recipients: mailerContent.to,
			subject: mailerData.subject,
			replyTo: mailerData.replyTo,
		},
		new Map(),
	);

	return original;
}
