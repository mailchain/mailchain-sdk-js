# Mailchain SDK monorepo

Mailchain is a messaging protocol that lets users communicate across protocols. Using Mailchain you can send messages to any blockchain address on different protocols.

For full usage examples view the [developer docs](https://docs.mailchain.com).

## Repo layout

Contains the packages directly related to the Mailchain SDK.

## Example

Send your first message

Try sending your first message a message to `0xbb56FbD7A2caC3e4C17936027102344127b7a112@ethereum.mailchain.com`, that's us at Mailchain, we own the private key for `0xbb56FbD7A2caC3e4C17936027102344127b7a112`.

```ts
import { Mailchain } from '@mailchain/sdk';

const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE!; // 25 word mnemonicPhrase

const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

const result = await mailchain.sendMail({
	from: `yoursername@mailchain.com`, // sender address
	to: [`0xbb56FbD7A2caC3e4C17936027102344127b7a112@ethereum.mailchain.com`], // list of recipients (blockchain or mailchain addresses)
	subject: 'My first message', // subject line
	content: {
		text: 'Hello Mailchain 👋', // plain text body
		html: '<p>Hello Mailchain 👋</p>', // html body
	},
});

console.log(result);
```

_You can send a message to yourself your `username@mailchain` if you've registered an ethereum address you can send a message to it `0x.....@mailchain.com`, or try sending a message to `0xbb56FbD7A2caC3e4C17936027102344127b7a112@ethereum.mailchain.com`, that's us at Mailchain, we own the private key for `0xbb56FbD7A2caC3e4C17936027102344127b7a112`._
