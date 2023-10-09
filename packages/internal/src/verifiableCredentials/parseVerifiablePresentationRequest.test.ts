import canonicalize from 'canonicalize';
import { parseVerifiablePresentationRequest } from './parseVerifiablePresentationRequest';
import { VerifiablePresentationRequest } from './request';

const originalVcRequest: VerifiablePresentationRequest = {
	type: 'MailchainMessagingKeyCredential',
	requestId: 'request-id',
	version: '1.0',
	from: 'example-app@mailchain.test',
	to: 'alice@mailhain.test',
	actions: ['Authenticate', 'Join Meeting'],
	resources: ['meeting/*'],
	signedCredentialExpiresAt: new Date('2020-02-03T00:00:00.000Z'),
	signedCredentialExpiresAfter: 3600,
	requestExpiresAfter: new Date('2020-02-02T00:00:00.000Z'),
	nonce: '1234',
	approvedCallback: {
		url: 'https://example.com/callback',
	},
};

describe('parseVerifiablePresentationRequest', () => {
	it('should parse a verifiable presentation request', async () => {
		const json = canonicalize(originalVcRequest)!;

		const vcRequest = parseVerifiablePresentationRequest(json);

		expect(vcRequest).toEqual(originalVcRequest);
	});
});
