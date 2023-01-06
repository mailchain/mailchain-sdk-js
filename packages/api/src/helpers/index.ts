import * as apiKeyToCryptoKey from './apiKeyToCryptoKey';
import * as cryptoKeyToApiKey from './cryptoKeyToApiKey';

const ApiKeyConvert = {
	private: apiKeyToCryptoKey.convertPrivate,
	public: apiKeyToCryptoKey.convertPublic,
} as const;
const CryptoKeyConvert = {
	public: cryptoKeyToApiKey.convertPublic,
	private: cryptoKeyToApiKey.convertPrivate,
} as const;

export { ApiKeyConvert, CryptoKeyConvert };
