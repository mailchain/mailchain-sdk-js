import { encodePublicKey } from '@mailchain/crypto';
import { mock, MockProxy } from 'jest-mock-extended';
import { AliceSECP256K1PublicAddress } from '../ethereum/test.const';
import { user } from '../protobuf/user/user';
import { IdentityKeys } from '../identityKeys';
import { createV2IdentityKey, createV3LabelMigration, UserMailboxMigrationRule } from './migrations';
import { AliceWalletMailbox } from './test.const';

const v1Mailbox = user.Mailbox.create({
	address: AliceSECP256K1PublicAddress,
	nonce: 1,
	protocol: 'ethereum',
	network: 'main',
});

const v2Mailbox = user.Mailbox.create({ ...v1Mailbox, identityKey: encodePublicKey(AliceWalletMailbox.identityKey) });

const v3Mailbox = user.Mailbox.create({
	...v2Mailbox,
	label: null,
});

describe('UserProfile migrations', () => {
	let migration: UserMailboxMigrationRule;

	describe('v1 to v2 - IdentitKey', () => {
		let identityKeys: MockProxy<IdentityKeys>;

		beforeEach(() => {
			identityKeys = mock();
			migration = createV2IdentityKey(identityKeys, 'mailchain.test');
		});

		it('should apply for mailbox with version 1', async () => {
			const shouldApply = await migration.shouldApply({ version: 1, protoMailbox: v1Mailbox });

			expect(shouldApply).toBe(true);
		});

		it('should not apply for mailbox above 1', async () => {
			const shouldApply2 = await migration.shouldApply({ version: 2, protoMailbox: v1Mailbox });
			const shouldApply3 = await migration.shouldApply({ version: 3, protoMailbox: v1Mailbox });
			const shouldApply200 = await migration.shouldApply({ version: 200, protoMailbox: v1Mailbox });

			expect(shouldApply2).toBe(false);
			expect(shouldApply3).toBe(false);
			expect(shouldApply200).toBe(false);
		});

		it('should add identity key from addressesApi when applied', async () => {
			identityKeys.getAddressIdentityKey.mockResolvedValueOnce({
				protocol: AliceWalletMailbox.messagingKeyParams.protocol,
				identityKey: AliceWalletMailbox.identityKey,
			});

			const migrated = await migration.apply({ version: 1, protoMailbox: v1Mailbox });

			expect(migrated).toEqual({ version: 2, protoMailbox: v2Mailbox });
		});
	});

	describe('v2 to v3 - label', () => {
		beforeEach(() => {
			migration = createV3LabelMigration('mailchain.test');
		});

		it('should add encoded address as default label to the mailbox', async () => {
			const shouldApply = await migration.shouldApply({ version: 2, protoMailbox: v2Mailbox });
			expect(shouldApply).toBe(true);

			const migrated = await migration.apply({ version: 2, protoMailbox: v2Mailbox });
			expect(migrated).toEqual({ version: 3, protoMailbox: v3Mailbox });
		});
	});
});
