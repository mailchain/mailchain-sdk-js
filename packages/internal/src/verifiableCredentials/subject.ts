export type CredentialSubject = CredentialSubjectOwnerOfMailchainMessagingKey;

export type CredentialSubjectOwnerOfMailchainMessagingKey = {
	ownerOf: {
		type: 'MailchainMessagingKey';
		address: string;
	};
};

export function createOwnerOfMessagingKeySubject(address: string): CredentialSubjectOwnerOfMailchainMessagingKey {
	return {
		ownerOf: {
			type: 'MailchainMessagingKey',
			address,
		},
	};
}
