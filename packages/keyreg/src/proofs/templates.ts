import { ProofParams } from './params';

export function simpleV1enUS(encodedAddress: string, encodedMessagingPublicKey: string, nonce: number): string {
	var lines = Array<string>(9);

	lines[0] = 'Welcome to Mailchain!';
	lines[1] = '';
	lines[2] = 'Sign to start using this address for messaging.';
	lines[3] = '';
	lines[4] = 'This request will not trigger a blockchain transaction or cost any gas fees.';
	lines[5] = '';
	lines[6] = `Address: ${encodedAddress}`;
	lines[7] = `Messaging key: ${encodedMessagingPublicKey}`;
	lines[8] = `Nonce: ${nonce}`;

	return lines.join('\n');
}

export function mailchainUsername(encodedAddress: string, encodedMessagingPublicKey: string, nonce: number): string {
	var lines = Array<string>(4);

	lines[0] = `Address: ${encodedAddress}`;
	lines[1] = `Messaging key: ${encodedMessagingPublicKey}`;
	lines[2] = `Nonce: ${nonce}`;
	lines[3] = 'Protocol: mailchain';

	return lines.join('\n');
}

const templateMessageFunctions = new Map<String, ParseTemplate>([
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
