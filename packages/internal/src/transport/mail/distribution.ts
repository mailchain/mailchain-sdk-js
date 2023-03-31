import { Payload } from '../payload';
import { MailAddress } from './types';

export type MailDistribution = {
	recipients: MailAddress[];
	payload: Payload;
};
