import { AliceSECP256K1PublicAddressStr } from '@mailchain/addressing/protocols/ethereum/test.const';
import {
	MailchainDecentralizedIdentifier,
	isMailchainAddressDecentralizedIdentifier,
	mailchainAddressDecentralizedIdentifier,
	mailchainAddressFromDecentralizedIdentifier,
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

describe('isMailchainAddressDecentralizedIdentifier', () => {
	it('should test positive', () => {
		const did: MailchainDecentralizedIdentifier = 'did:mailchain:alice%40mailchain.com';

		expect(isMailchainAddressDecentralizedIdentifier(did)).toEqual(true);
	});

	it('should test negative', () => {
		expect(isMailchainAddressDecentralizedIdentifier('did:eth:alice%40mailchain.com')).toEqual(false);
		expect(isMailchainAddressDecentralizedIdentifier('did:dev:mailchain:alice%40mailchain.com')).toEqual(false);
	});
});

describe('mailchainAddressFromDecentralizedIdentifier', () => {
	const did: MailchainDecentralizedIdentifier = 'did:mailchain:alice%40mailchain.com';

	const address = mailchainAddressFromDecentralizedIdentifier(did);

	expect(address).toEqual('alice@mailchain.com');
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
