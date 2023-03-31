import { PrivateKey } from '@mailchain/crypto';
import { MailchainResult } from '@mailchain/internal';
import { defaultConfiguration } from '@mailchain/internal/configuration';
import { GetExportablePrivateMessagingKeyError, PrivateMessagingKeys } from '@mailchain/internal/messagingKeys';
import { KeyRing } from '@mailchain/keyring';

export async function getPrivateMessagingKey(
	address: string,
	keyRing: KeyRing,
): Promise<MailchainResult<PrivateKey, GetExportablePrivateMessagingKeyError>> {
	return PrivateMessagingKeys.create(defaultConfiguration).getExportablePrivateMessagingKey(address, keyRing);
}
