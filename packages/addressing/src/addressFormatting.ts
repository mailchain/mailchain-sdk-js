import { humanNameServiceFormatters } from './addressFormattingRule';
import { formatMailLike } from './formatMailLike';
import { isNameServiceAddress, NameServiceAddress as MailchainAddress, NameServiceAddress } from './nameServiceAddress';

export function formatAddress(address: MailchainAddress, format: 'mail' | 'human-friendly'): string {
	if (isNameServiceAddress(address)) return formatNameServiceAddress(address, format);
	throw new Error(`unknown format of the provided address [${JSON.stringify(address)}]`);
}

function formatNameServiceAddress(address: NameServiceAddress, format: 'mail' | 'human-friendly'): string {
	switch (format) {
		case 'mail':
			return formatMailLike(address.username, address.domain);
		case 'human-friendly':
			for (const formatter of humanNameServiceFormatters) {
				const formatted = formatter(address);
				if (formatted) return formatted;
			}
			throw new Error(`failed to format address [${JSON.stringify(address)}]`);
	}
}
