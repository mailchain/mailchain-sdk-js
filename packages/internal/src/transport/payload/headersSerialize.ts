import canonicalize from 'canonicalize';
import {
	ResolvedMailerHeaders,
	createContentBuffer,
	isResolvedMailerHeaders,
	parseMailerContentFromJSON,
} from '../mailer';
import {
	PayloadHeadersSerializer,
	createOriginHeader,
	createSignatureHeader,
	headersMapFromBuffers,
	parseOriginHeader,
	parseSignatureHeader,
} from '../serialization';
import { ContentType, PayloadHeaders } from './headers';

const HEADER_CONTENT_ENCODING = 'Content-Encoding';
const HEADER_CONTENT_ENCRYPTION = 'Content-Encryption';
const HEADER_CONTENT_LENGTH = 'Content-Length';
const HEADER_CONTENT_SIGNATURE = 'Content-Signature';
const HEADER_CONTENT_TYPE = 'Content-Type';
const HEADER_CREATED = 'Created';
const HEADER_ORIGIN = 'Origin';
const HEADER_MAILER_CONTENT = 'Mailer-Content';
const HEADER_PLUGINS = 'Plugin';

export class SerializablePayloadHeadersImpl implements PayloadHeadersSerializer {
	deserialize(buffer: Buffer): PayloadHeaders {
		const { headers } = headersMapFromBuffers(buffer, [
			HEADER_CONTENT_ENCODING,
			HEADER_CONTENT_ENCRYPTION,
			HEADER_CONTENT_LENGTH,
			HEADER_CONTENT_SIGNATURE,
			HEADER_CONTENT_TYPE,
			HEADER_CREATED,
			HEADER_ORIGIN,
		]);

		const output: PayloadHeaders = {
			ContentEncoding: headers.get(HEADER_CONTENT_ENCODING)!.toString(),
			ContentEncryption: headers.get(HEADER_CONTENT_ENCRYPTION)!.toString(),
			ContentLength: Number.parseInt(headers.get(HEADER_CONTENT_LENGTH)!.toString()!),
			ContentSignature: parseSignatureHeader(headers.get(HEADER_CONTENT_SIGNATURE)!.toString()),
			ContentType: headers.get(HEADER_CONTENT_TYPE)!.toString() as ContentType,
			Created: new Date(headers.get(HEADER_CREATED)!.toString()!),
			Origin: parseOriginHeader(headers.get(HEADER_ORIGIN)!.toString()),
			PluginHeaders: headers.has(HEADER_PLUGINS) ? JSON.parse(headers.get(HEADER_PLUGINS)!) : undefined,
		};

		if (headers.get(HEADER_MAILER_CONTENT)) {
			const mailerOutput: ResolvedMailerHeaders = {
				...output,
				ContentType: output.ContentType as 'message/x.mailchain-mailer',
				MailerContent: parseMailerContentFromJSON(headers.get(HEADER_MAILER_CONTENT)!.toString()),
			};
			return mailerOutput;
		}

		return output;
	}

	serialize<H extends PayloadHeaders>(headers: H): Buffer {
		const headersList: string[] = [];
		headersList.push(`${HEADER_CONTENT_ENCODING}: ${headers.ContentEncoding}`);
		headersList.push(`${HEADER_CONTENT_ENCRYPTION}: ${headers.ContentEncryption}`);
		headersList.push(`${HEADER_CONTENT_LENGTH}: ${headers.ContentLength}`);
		headersList.push(
			`${HEADER_CONTENT_SIGNATURE}: ${createSignatureHeader(headers.ContentSignature, headers.Origin)}`,
		);
		headersList.push(`${HEADER_CONTENT_TYPE}: ${headers.ContentType}`);
		headersList.push(`${HEADER_CREATED}: ${headers.Created.toISOString()}`);

		headersList.push(`${HEADER_ORIGIN}: ${createOriginHeader(headers.Origin)}`);

		if (headers.PluginHeaders) {
			headersList.push(`${HEADER_PLUGINS}: ${canonicalize(headers.PluginHeaders)}`);
		}

		if (isResolvedMailerHeaders(headers)) {
			headersList.push(`${HEADER_MAILER_CONTENT}:  ${createContentBuffer(headers.MailerContent)}`);
		}

		return Buffer.from(headersList.join('\r\n'), 'utf8');
	}
}
