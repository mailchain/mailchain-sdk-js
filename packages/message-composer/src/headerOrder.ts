import { HEADER_LABELS } from './consts';
import { Header } from './types';

/** Definition for the ordering the the headers. It is not something required by specification, but looks prettier. */
export const HEADER_ORDERS: { [key: string]: number | undefined } = {
	[HEADER_LABELS.MimeVersion]: 100,
	[HEADER_LABELS.Date]: 90,
	[HEADER_LABELS.MessageId]: 80,
	[HEADER_LABELS.Subject]: 50,
	[HEADER_LABELS.From]: 34,
	[HEADER_LABELS.ReplyTo]: 33,
	[HEADER_LABELS.To]: 32,
	[HEADER_LABELS.Cc]: 31,
	[HEADER_LABELS.Bcc]: 30,
	[HEADER_LABELS.ContentType]: -100,
	[HEADER_LABELS.ContentDisposition]: -101,
	[HEADER_LABELS.ContentTransferEncoding]: -102,
	[HEADER_LABELS.ContentId]: -103,
} as const;

/** Compares two headers for their ordering by using the {@link HEADER_ORDERS}. */
export function byHeaderOrder<A, B>(a: Header<A>, b: Header<B>): number {
	return (HEADER_ORDERS[b.label] ?? 0) - (HEADER_ORDERS[a.label] ?? 0);
}
