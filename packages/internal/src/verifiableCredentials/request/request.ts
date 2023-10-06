import { CredentialPayloadType } from '..';
export type VerifiablePresentationRequest = {
	type: CredentialPayloadType;
	version: '1.0';

	/**
	 * A identifier for the request that is unique to the application making the request.
	 */
	requestId: string;

	/**
	 * Mailchain address of who the request is being made by.
	 * @example
	 * 	example-app@mailchain.com
	 *  example-app.eth@ens.mailchain.com
	 */
	from: string;
	/**
	 * Mailchain address of who the request is being made to.
	 *
	 * @example
	 * 	alice@mailchain.com
	 *  {ethereumAddress}@ethereum.mailchain.com
	 */
	to: string;

	/**
	 * The actions that the holder is allowed to perform against the resources. Actions should be human readable, yet interpretable by the application.
	 * @example
	 * 	['Authenticate', 'Join meeting']
	 */
	actions: string[];

	/**
	 * The resource ID's that the actions may be performed on. Access to all resources are indicated with a `*`.
	 * @example
	 * 	['*'] - all resources
	 * 	['1234'] - resource with ID 1234
	 *  ['1234', '5678'] - resources with ID 1234 and 5678
	 * 	['meeting/*'] - all meetings
	 *  ['meeting/1234', 'meeting/5678'] - meeting ids 1234 and 5678
	 */
	resources: string[];

	/**
	 * Once signed the credential expires after this date.
	 *
	 * When used together with {@link VerifiablePresentationRequest.signedCredentialExpiresAfter} the earliest of the two dates is used.
	 */
	signedCredentialExpiresAt?: Date;

	/**
	 * Number of seconds that the signed the credential expires after it has been signed.
	 * This allows requesting a credential to be valid for a certain amount of time from signing.
	 *
	 * When used together with {@link VerifiablePresentationRequest.signedCredentialExpiresAt} the earliest of the two dates is used.
	 */
	signedCredentialExpiresAfter?: number;

	/**
	 * The date and time the request expires. A user will not be asked to provide a verifiable credential after this date.
	 * The request should be considered invalid after this time.
	 */
	requestExpiresAfter?: Date;

	/**
	 * A value that is included in the signed credential, this value is used to prevent replay attacks.
	 * Replay attacks are when a signed credential is used more than once. The nonce is checked at the time of verification.
	 */
	nonce?: string;

	/**
	 * Callback to use to once the request has been approved.
	 */
	approvedCallback: {
		/**
		 * The URL to redirect the user to once the request has been approved.
		 */
		url: string;
	};
};
