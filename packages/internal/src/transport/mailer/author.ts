import { PublicKey } from '@mailchain/crypto';
import { MailerProof, verifyMailerProof } from '@mailchain/signatures';
import { Configuration } from '../../configuration';
import { MailAddress } from '../mail';
import { SenderVerifier } from '../verifier';
import { MailerContent } from './content';

export class MailerAuthorVerifier {
	constructor(private readonly sender: SenderVerifier) {}

	static create(configuration: Configuration) {
		return new MailerAuthorVerifier(SenderVerifier.create(configuration));
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
		return await this.sender.verifySenderOwnsFromAddress(fromAddress.address, authorMessagingKey);
	}

	private async verifyMailerProof(authorMessagingKey: PublicKey, mailerProof: MailerProof) {
		return verifyMailerProof(authorMessagingKey, mailerProof);
	}
}
