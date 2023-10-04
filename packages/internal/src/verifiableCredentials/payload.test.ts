import { createVerifiableCredential } from './payload';

describe('createVerifiableCredential', () => {
	it('create - ownerOf', () => {
		const actual = createVerifiableCredential({
			credentialSubjects: [
				{
					ownerOf: {
						address: 'address',
						type: 'MailchainMessagingKey',
					},
				},
			],
			issuanceDate: new Date(2000, 1, 1),
			issuerId: 'did:mailchain:issuer',
			proof: {
				type: 'proof-type',
			},
			termsOfUse: [
				{
					id: 'terms-1',
					actions: ['action'],
					assignee: 'did:mailchain:assignee',
					assigner: 'did:mailchain:assigner',
					effect: 'Allow',
					resources: ['*'],
					type: 'HolderPolicy',
				},
			],
			type: 'MailchainMessagingKeyCredential',
		});

		expect(actual).toMatchSnapshot();
	});
});
