import { W3C_CREDENTIALS_CONTEXT } from './context';
import { createPresentationPayload } from './presentation';

describe('createPresentationPayload', () => {
	it('create', () => {
		const actual = createPresentationPayload({
			holder: 'did:mailchain:holder',
			issuanceDate: new Date(2020, 1, 1),
			verifiableCredential: {
				'@context': [W3C_CREDENTIALS_CONTEXT],
				credentialSubject: {
					id: 'credentialSubjectId',
				},
				issuanceDate: new Date(2000, 1, 1).toISOString(),
				issuer: { id: 'did:mailchain:issuer' },
				proof: { id: 'proof' },
				type: ['type'],
			},
			verifier: 'did:mailchain:verifier',
		});

		expect(actual).toMatchSnapshot();
	});
});
