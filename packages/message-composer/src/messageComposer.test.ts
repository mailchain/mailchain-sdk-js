import { readFileSync, writeFileSync } from 'fs';
import { createMessageComposer } from './messageComposer';
import { defaultMessageComposerContext, MessageComposerContext } from './messageComposerContext';

describe('MailchainMessageComposer UTF8', () => {
	let messageComposerContext: MessageComposerContext;

	beforeEach(() => {
		messageComposerContext = {
			...defaultMessageComposerContext(),
			random: jest
				.fn()
				.mockReturnValueOnce(new Uint8Array([1, 2, 3]))
				.mockReturnValueOnce(new Uint8Array([4, 5, 6]))
				.mockReturnValueOnce(new Uint8Array([7, 8, 9])),
		};
	});

	it('should compose whole message with content and attachment', async () => {
		const composer = createMessageComposer(messageComposerContext)
			.id('47bdaf40-c3da-49f7-bfc7-66337f35c6c1@mailchain.com') // optional
			.subject('Subject can contain UTF-8 chars including emojis 😉')
			.date(new Date('08/28/2022'))
			.from({ name: 'Bob', address: 'bob@mailchain.com' })
			.recipients('To', { name: 'Alice', address: 'alice@mailchain.com' })
			.recipients('Cc', { name: 'Joe Doe', address: 'joe@mailchain.com' })
			.recipients(
				'Bcc',
				{ name: 'Jane Doe', address: 'jane@mailchain.com' },
				{ name: 'Bob', address: 'bob@mailchain.com' },
			)
			.message('plain', Buffer.from('Plaintext content. Can also contain UTF-8 and emojis 🤐.'))
			.message('html', Buffer.from('This is ✨rich-text✨ HTML <b>content</b>.'))
			.attachment({
				cid: 'bfcd3a31-646b-4dcd-a1ea-06d37baf7d2e',
				contentType: 'image/png',
				filename: 'mailchain-logo.png',
				content: readFileSync(`${__dirname}/__tests__/mailchain-logo.png`),
			});

		const res = await composer.build();

		writeFileSync(`${__dirname}/__tests__/mail_with_attachment-sender.eml`, res.forSender);
		writeFileSync(`${__dirname}/__tests__/mail_with_attachment-visible-recipients.eml`, res.forVisibleRecipients);
		res.forBlindedRecipients.forEach((value, index) => {
			writeFileSync(`${__dirname}/__tests__/mail_with_attachment-${value[0].address}.eml`, value[1]);
		});

		expect(res.forSender).toMatchSnapshot();
		expect(res.forVisibleRecipients).toMatchSnapshot();
		expect(res.forBlindedRecipients).toMatchSnapshot();
	});
});
