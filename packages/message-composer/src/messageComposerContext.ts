import { encodeBase64, encodeBase64UrlSafe } from '@mailchain/encoding/base64';
import { decodeUtf8 } from '@mailchain/encoding/utf8';

export type MessageComposerContext = {
	random: (len: number) => Uint8Array;
	decodeUtf8: (content: string) => Promise<Uint8Array>;
	encodeBase64: (content: Uint8Array, urlSafe?: boolean) => Promise<string>;
};

export function defaultMessageComposerContext(): MessageComposerContext {
	return {
		random: (len) => crypto.getRandomValues(new Uint8Array(len)),
		decodeUtf8: (content) => Promise.resolve(decodeUtf8(content)),
		encodeBase64: (content, urlSafe) =>
			urlSafe ? Promise.resolve(encodeBase64UrlSafe(content)) : Promise.resolve(encodeBase64(content)),
	};
}
