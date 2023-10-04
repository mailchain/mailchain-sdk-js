import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { mock } from 'jest-mock-extended';
import { VerifiableMailchainAddressOwnerCreator } from './factory';
import { MailchainAddressOwnershipIssuer } from './issuer';

describe('VerifiableMailchainAddressOwnerCreator', () => {
	it('should create', async () => {
		const mockMailchainAddressOwnershipIssuer = mock<MailchainAddressOwnershipIssuer>();
		mockMailchainAddressOwnershipIssuer.createVerifiableMailchainAddressOwnership.mockResolvedValue({
			data: 'mockedVerifiablePresentation',
		});
		const target = new VerifiableMailchainAddressOwnerCreator(
			AliceED25519PrivateKey,
			mockMailchainAddressOwnershipIssuer,
			'mailchain.test',
		);
		const result = await target.createVerifiableMailchainAddressOwner({
			from: 'app@mailchain.test',
			to: 'alice@mailchain.test',
			actions: ['Authenticate', 'Join Meeting'],
			resources: ['*'],
			signedCredentialExpiresAfter: 600,
			nonce: '1234',
			type: 'MailchainMessagingKeyCredential',
			version: '1.0',
			approvedCallback: {
				url: 'https://example.com',
			},
		});

		expect(result).toEqual({ data: 'mockedVerifiablePresentation' });
		expect(mockMailchainAddressOwnershipIssuer.createVerifiableMailchainAddressOwnership).toHaveBeenCalledWith({
			address: 'alice@mailchain.test',
			requester: 'app@mailchain.test',
			actions: ['Authenticate', 'Join Meeting'],
			resources: ['*'],
			signer: AliceED25519PrivateKey,
			options: {
				expiresAt: undefined,
				expiresIn: 600,
				nonce: '1234',
			},
		});
	});
});
