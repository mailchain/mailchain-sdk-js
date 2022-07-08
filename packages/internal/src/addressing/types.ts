import { ProtocolType } from '../protocols';

export type MailchainAddress = {
	value: string;
	protocol: ProtocolType;
	domain: string;
};
