import { HEADER_LABELS } from './consts';
import { Header, HeaderAttribute } from './types';

export function createHeader<T>(label: string, value: T, ...attrs: HeaderAttribute[]): Header<T> {
	return { label, value, attrs };
}

export function contentTypeBoundaryHeader(type: 'alternative' | 'mixed', boundary: string): Header<string> {
	return createHeader(HEADER_LABELS.ContentType, `multipart/${type}`, ['boundary', boundary]);
}
