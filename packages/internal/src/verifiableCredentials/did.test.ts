import { AliceSECP256K1PublicAddressStr } from '@mailchain/addressing/protocols/ethereum/test.const';
import {
	mailchainAddressDecentralizedIdentifier,
	mailchainBlockchainAddressDecentralizedIdentifier,
	mailchainMessagingKeyDecentralizedIdentifier,
} from './did';

describe('mailchainAddressDecentralizedIdentifier', () => {
	it('create', () => {
		expect(mailchainAddressDecentralizedIdentifier('alice@mailchain.com')).toEqual(
			'did:mailchain:alice%40mailchain.com',
		);
	});
});

describe('mailchainMessagingKeyDecentralizedIdentifier', () => {
	it('create', () => {
		expect(mailchainMessagingKeyDecentralizedIdentifier('alice@mailchain.com')).toEqual(
			'did:mailchain:alice%40mailchain.com/messaging-key',
		);
	});
});

describe('mailchainBlockchainAddressDecentralizedIdentifier', () => {
	it('create', () => {
		expect(mailchainBlockchainAddressDecentralizedIdentifier('ethereum', AliceSECP256K1PublicAddressStr)).toEqual(
			'did:mailchain:ethereum:0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6',
		);
	});
});
