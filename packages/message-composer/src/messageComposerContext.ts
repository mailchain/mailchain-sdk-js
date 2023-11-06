import { encodeBase64, encodeBase64UrlSafe, decodeUtf8 } from '@mailchain/encoding';

export type MessageComposerContext = {
	random: (len: number) => Promise<Uint8Array>;
	decodeUtf8: (content: string) => Promise<Uint8Array>;
	encodeBase64: (content: Uint8Array, urlSafe?: boolean) => Promise<string>;
};

export function defaultMessageComposerContext(): MessageComposerContext {
	return {
		random: (len) =>
			globalThis.crypto != null
				? Promise.resolve(globalThis.crypto.getRandomValues(new Uint8Array(len)))
				: import('crypto').then(({ webcrypto }) => webcrypto.getRandomValues(new Uint8Array(len))),
		decodeUtf8: (content) => Promise.resolve(decodeUtf8(content)),
		encodeBase64: (content, urlSafe) =>
			urlSafe ? Promise.resolve(encodeBase64UrlSafe(content)) : Promise.resolve(encodeBase64(content)),
	};
}
