import { ProofParams } from './params';

export function simpleV1enUS(encodedAddress: string, encodedMessagingPublicKey: string, nonce: number): string {
	const lines = Array<string>(11);

	lines[0] = 'Welcome to Mailchain!';
	lines[1] = '';
	lines[2] = `Please sign to start using this address with Mailchain. This will not trigger a blockchain transaction or cost any gas fees.`;
	lines[3] = '';
	lines[4] = `What's happening?`;
	lines[5] = `A messaging key will be registered with this address and used only for messaging. It will replace any existing registered messaging keys.`;
	lines[6] = '';
	lines[7] = 'Technical Details:';
	lines[8] = `Address: ${encodedAddress}`;
	lines[9] = `Messaging key: ${encodedMessagingPublicKey}`;
	lines[10] = `Nonce: ${nonce}`;

	return lines.join('\n').trim();
}

export function mailchainUsername(encodedAddress: string, encodedMessagingPublicKey: string, nonce: number): string {
	const lines = Array<string>(4);

	lines[0] = `Address: ${encodedAddress}`;
	lines[1] = `Messaging key: ${encodedMessagingPublicKey}`;
	lines[2] = `Nonce: ${nonce}`;
	lines[3] = 'Protocol: mailchain';

	return lines.join('\n').trim();
}

const templateMessageFunctions = new Map<string, ParseTemplate>([
	['simple-v1-en', simpleV1enUS],
	['simple-v1-en_US', simpleV1enUS],
	['mailchain-username-en', mailchainUsername],
]);

export type ParseTemplate = (encodedAddress: string, encodedPublicKey: string, nonce: number) => string;

export function getTemplate(params: ProofParams): ParseTemplate {
	const templateName = `${params.Variant}-${params.Locale}`;
	const template = templateMessageFunctions.get(templateName);
	if (template === undefined) {
		throw new Error(`Message template [${templateName}] not found!`);
	}
	return template!;
}
