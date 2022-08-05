import { convertPrivate, convertPublic } from './apiKeyToCryptoKey';

const ApiKeyConvert = { private: convertPrivate, public: convertPublic } as const;

export { ApiKeyConvert };
