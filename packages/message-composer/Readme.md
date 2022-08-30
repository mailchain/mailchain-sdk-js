# Mailchain Message Composer

> **Warning** `@mailchain/message-composer` library is in development and may not cover all cases yet. Use with caution.

RFC-5322 compliant MIME message composer for Node and for the browser. Just add the content you want and let the library take care of formatting it according to the specification.

## Usage

```ts
const msg = createMessageComposer(messageComposerContext)
	// .id('47bdaf40-c3da-49f7-bfc7-66337f35c6c1@mailchain.com') // Optional
	.subject('Subject can contain UTF-8 chars including emojis 😉')
	// .date(new Date('08/28/2022')) // Optional
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
		content: readFileSync('mailchain-logo.png'),
	});

const { forSender, forVisibleRecipients, forBlindedRecipients } = await msg.build();
```

For full usage examples view the [developer docs](https://docs.mailchain.com).

## Installing

Using npm:

```bash
$ npm install @mailchain/message-composer
```

Using yarn:

```bash
$ yarn add @mailchain/message-composer
```
