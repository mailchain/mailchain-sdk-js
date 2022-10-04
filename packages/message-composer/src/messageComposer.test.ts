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
			.customHeader(
				'X-IdentityKeys',
				'', // empty header value
				['alice@mailchain.com', '0x74fcd5537c423eef7ae88bf1b4b8520d6180ca509e70ce8d2e9f04b1a225c6a6:mailchain'],
				['joe@mailchain.com', '0x3378957bdb1d09700d5e189eea9d913d0973d158bc2e3718ba5fb39261d08cfa:mailchain'],
			)
			.overrideBccHeader(
				'jane@mailchain.com',
				'X-IdentityKeys',
				'', // empty header value
				['alice@mailchain.com', '0x74fcd5537c423eef7ae88bf1b4b8520d6180ca509e70ce8d2e9f04b1a225c6a6:mailchain'],
				['joe@mailchain.com', '0x3378957bdb1d09700d5e189eea9d913d0973d158bc2e3718ba5fb39261d08cfa:mailchain'],
				['jane@mailchain.com', '0xed07f1a7c4261763f26814ac48e07f263a92cc07cf1ed9f47f48d829aaa3d45d:mailchain'],
			)
			.overrideBccHeader(
				'bob@mailchain.com',
				'X-IdentityKeys',
				'', // empty header value
				['alice@mailchain.com', '0x74fcd5537c423eef7ae88bf1b4b8520d6180ca509e70ce8d2e9f04b1a225c6a6:mailchain'],
				['joe@mailchain.com', '0x3378957bdb1d09700d5e189eea9d913d0973d158bc2e3718ba5fb39261d08cfa:mailchain'],
				['bob@mailchain.com', '0x13e451f1dc07eb5af675d14e5136d65c6573bc9114448a26d936973af00ba688:mailchain'],
			)
			.overrideSenderHeader(
				'X-IdentityKeys',
				'',
				['alice@mailchain.com', '0x74fcd5537c423eef7ae88bf1b4b8520d6180ca509e70ce8d2e9f04b1a225c6a6:mailchain'],
				['joe@mailchain.com', '0x3378957bdb1d09700d5e189eea9d913d0973d158bc2e3718ba5fb39261d08cfa:mailchain'],
				['jane@mailchain.com', '0xed07f1a7c4261763f26814ac48e07f263a92cc07cf1ed9f47f48d829aaa3d45d:mailchain'],
				['bob@mailchain.com', '0x13e451f1dc07eb5af675d14e5136d65c6573bc9114448a26d936973af00ba688:mailchain'],
			)
			.replyTo({ name: 'Robert', address: 'robert@mailchain.com' })
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
