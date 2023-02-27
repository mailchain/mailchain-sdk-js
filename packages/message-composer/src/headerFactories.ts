import { HEADER_LABELS } from './consts';
import { Header, HeaderAttribute, MessageIdsHeader } from './types';

export function createHeader<T>(label: string, value: T, ...attrs: HeaderAttribute[]): Header<T> {
	return { label, value, attrs };
}

export function createMessageIdHeader(label: string, ids: string[], ...attrs: HeaderAttribute[]): MessageIdsHeader {
	return {
		label,
		value: {
			type: 'message-ids',
			ids,
		},
		attrs,
	};
}

export function contentTypeBoundaryHeader(type: 'alternative' | 'mixed', boundary: string): Header<string> {
	return createHeader(HEADER_LABELS.ContentType, `multipart/${type}`, ['boundary', boundary]);
}
