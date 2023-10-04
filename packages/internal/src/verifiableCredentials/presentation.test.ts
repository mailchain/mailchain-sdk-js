import { W3C_CREDENTIALS_CONTEXT } from './context';
import { createPresentationPayload } from './presentation';

describe('createPresentationPayload', () => {
	afterAll(() => {
		jest.resetAllMocks();
		jest.clearAllTimers();
	});
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date(2020, 1, 1));
	});

	it('create', () => {
		const actual = createPresentationPayload({
			holder: 'did:mailchain:holder',
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
