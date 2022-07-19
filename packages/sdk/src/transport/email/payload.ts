import { MIMEMessage } from 'mimetext';
import { DecodeBase64, EncodingTypes } from '@mailchain/encoding';
import { PrivateKey } from '@mailchain/crypto';
import { KindNaClSecretKey } from '@mailchain/crypto/cipher';
import { PayloadHeaders } from '../content/headers';
import { Payload } from '../content/payload';

export class EncryptedEmail implements Payload {
	Headers: PayloadHeaders;
	Content: Buffer;
	constructor(headers: PayloadHeaders, content: Buffer) {
		this.Headers = headers;
		this.Content = content;
	}

	static async fromMimeMessage(message: MIMEMessage, senderIdentityKey: PrivateKey): Promise<EncryptedEmail> {
		const raw = DecodeBase64(message.asEncoded());

		const headers: PayloadHeaders = {
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
			ContentLength: raw.length,
			ContentSignature: await senderIdentityKey.Sign(raw),
			ContentType: 'message/x.mailchain', // TODO: check this out?? email?
			Created: new Date(),
			Origin: senderIdentityKey.PublicKey,
		};

		return new this(headers, Buffer.from(raw));
	}
}
