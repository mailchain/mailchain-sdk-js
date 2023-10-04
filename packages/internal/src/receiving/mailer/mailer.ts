import { verifyMailerProof } from '@mailchain/signatures';
import axios, { AxiosInstance } from 'axios';
import { decodeBase64, decodeUtf8, encodeUtf8 } from '@mailchain/encoding';
import {
	isMailerPayload,
	MailerContent,
	MailerData,
	parseMailerContentFromJSON,
	Payload,
	ResolvedMailerPayload,
} from '../../transport';
import { Configuration } from '../../configuration';
import { createMimeMessage } from '../../formatters/generate';
import { MailerAuthorVerifier } from './author';

export class MailerContentResolver {
	constructor(private readonly axiosInstance: AxiosInstance, private readonly sender: MailerAuthorVerifier) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		return new MailerContentResolver(axiosInstance, MailerAuthorVerifier.create(configuration));
	}

	async get(payload: Payload): Promise<ResolvedMailerPayload> {
		if (!isMailerPayload(payload)) {
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

		const utf8EncodedContent = decodeUtf8(processedContent);
		const mailerPayload: ResolvedMailerPayload = {
			...payload,
			Headers: { ...payload.Headers, MailerContent: mailerContent },
			Content: Buffer.from(utf8EncodedContent),
		};

		const senderOwnsFromAddress = await this.sender.verifyAuthorOwnsFromAddress(
			payload,
			Buffer.from(utf8EncodedContent),
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
