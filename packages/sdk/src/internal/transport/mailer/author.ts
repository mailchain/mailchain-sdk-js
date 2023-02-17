import { PublicKey } from '@mailchain/crypto';
import { MailerProof, verifyMailerProof } from '@mailchain/signatures';
import { Configuration } from '../../..';
import { MailAddress, MailSenderVerifier } from '../mail';
import { MailerContent } from './content';

export class MailerAuthorVerifier {
	constructor(private readonly sender: MailSenderVerifier) {}

	static create(configuration: Configuration) {
		return new MailerAuthorVerifier(MailSenderVerifier.create(configuration));
	}

	async verifyMailerAuthor(mailerContent: MailerContent) {
		if (!this.verifyMailerProof(mailerContent.authorMessagingKey, mailerContent.mailerProof)) {
			throw new Error('mailer proof is not valid');
		}

		if (
			!this.verifyAuthorWroteContent(
				mailerContent.contentUri,
				mailerContent.mailerProof.params.authorContentSignature,
				mailerContent.authorMessagingKey,
			)
		) {
			throw new Error('authorContentSignature is not valid');
		}

		if (!this.verifyAuthorOwnsFromAddress(mailerContent.authorMailAddress, mailerContent.authorMessagingKey)) {
			throw new Error('messaging is not the latest message key for author address');
		}

		return;
	}

	private async verifyAuthorWroteContent(
		contentUri: string,
		authorContentSignature: Uint8Array,
		authorMessagingKey: PublicKey,
	): Promise<boolean> {
		return authorMessagingKey.verify(Buffer.from(contentUri), authorContentSignature);
	}

	private async verifyAuthorOwnsFromAddress(
		fromAddress: MailAddress,
		authorMessagingKey: PublicKey,
	): Promise<boolean> {
		// Use the authors messaging key too see if the `from` address is valid.
		return await this.sender.verifySenderOwnsFromAddress(fromAddress, authorMessagingKey);
	}

	private async verifyMailerProof(authorMessagingKey: PublicKey, mailerProof: MailerProof) {
		return verifyMailerProof(authorMessagingKey, mailerProof);
	}
}
