import { Payload } from '../payload';
import { MailAddress } from './types';

export type Distribution = {
	recipients: MailAddress[];
	payload: Payload;
};
