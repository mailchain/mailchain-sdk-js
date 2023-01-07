import { EncodingType, EncodingTypes } from '@mailchain/encoding';
import { AddressEncodingEnum } from '../api/api';

export function encodingTypeToEncodingEnum(encoding: EncodingType): AddressEncodingEnum {
	switch (encoding) {
		case EncodingTypes.Hex:
			return AddressEncodingEnum.HexPlain;
		case EncodingTypes.Hex0xPrefix:
			return AddressEncodingEnum.Hex0xPrefix;
		case EncodingTypes.Utf8:
			return AddressEncodingEnum.TextUtf8;
	}
	throw new Error(`unsupported encoding by API of [${encoding}]`);
}
