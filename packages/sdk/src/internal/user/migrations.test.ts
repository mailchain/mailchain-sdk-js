import { encodePublicKey } from '@mailchain/crypto';
import { mock, MockProxy } from 'jest-mock-extended';
import { AliceSECP256K1PublicAddress, AliceSECP256K1PublicAddressStr } from '../ethereum/test.const';
import { user } from '../protobuf/user/user';
import { IdentityKeys } from '../identityKeys';
import { Nameservices } from '../nameservices';
import {
	createV2IdentityKey,
	createV3LabelMigration,
	createV4AliasesMigration,
	createV5NsMigration,
	UserMailboxMigrationRule,
} from './migrations';
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

const v4Mailbox = user.Mailbox.create({
	...v3Mailbox,
	aliases: [
		{
			address: `${AliceSECP256K1PublicAddressStr.toLowerCase()}@ethereum.mailchain.test`,
			blockSending: false,
			blockReceiving: false,
		},
	],
});

const v5Mailbox = user.Mailbox.create({
	...v4Mailbox,
	aliases: [
		...v4Mailbox.aliases,
		{ address: 'alice.eth@mailchain.test', blockSending: false, blockReceiving: false },
		{ address: '👩🏼‍💻.alice.eth@mailchain.test', blockSending: false, blockReceiving: false },
	],
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

		it('should set null label for the mailbox', async () => {
			const shouldApply = await migration.shouldApply({ version: 2, protoMailbox: v2Mailbox });
			expect(shouldApply).toBe(true);

			const migrated = await migration.apply({ version: 2, protoMailbox: v2Mailbox });
			expect(migrated).toEqual({ version: 3, protoMailbox: v3Mailbox });
		});
	});

	describe('v3 to v4 - mailbox aliases', () => {
		beforeEach(() => {
			migration = createV4AliasesMigration('mailchain.test');
		});

		it('should set encoded address as alias', async () => {
			const shouldApply = await migration.shouldApply({ version: 3, protoMailbox: v3Mailbox });
			expect(shouldApply).toBe(true);

			const migrated = await migration.apply({ version: 3, protoMailbox: v3Mailbox });
			expect(migrated).toEqual({ version: 4, protoMailbox: v4Mailbox });
		});
	});

	describe('v4 to v5 - fetch nameservice aliases', () => {
		let nameservices: MockProxy<Nameservices>;

		beforeEach(() => {
			nameservices = mock();
			migration = createV5NsMigration(nameservices, 'mailchain.test');
		});

		it('should apply for version 4', async () => {
			expect(await migration.shouldApply({ version: 4, protoMailbox: v4Mailbox })).toBe(true);
			expect(await migration.shouldApply({ version: 4, protoMailbox: v5Mailbox })).toBe(true);
		});

		it('should add found nameservice names as aliases to the mailbox', async () => {
			nameservices.reverseResolveNames.mockResolvedValue([
				{ name: 'alice.eth', resolver: 'ens' },
				{ name: '👩🏼‍💻.alice.eth', resolver: 'ens' },
				{ name: 'alice.eth', resolver: 'ens' }, // duplicate
			]);

			const migrated = await migration.apply({ version: 4, protoMailbox: v4Mailbox });

			expect(migrated).toEqual({ version: 5, protoMailbox: v5Mailbox });
		});

		it('should not add duplicate nameservice names as aliases', async () => {
			nameservices.reverseResolveNames.mockResolvedValue([
				{ name: 'alice.eth', resolver: 'ens' },
				{ name: '👩🏼‍💻.alice.eth', resolver: 'ens' },
			]);

			const migrated = await migration.apply({ version: 4, protoMailbox: v5Mailbox }); // v5 already has the aliases

			expect(migrated).toEqual({ version: 5, protoMailbox: v5Mailbox });
		});

		it('should not throw on failed ns reverse search and bump up the version', async () => {
			nameservices.reverseResolveNames.mockRejectedValue(new Error('ns error'));

			const migrated = await migration.apply({ version: 4, protoMailbox: v4Mailbox });

			expect(migrated).toEqual({ version: 5, protoMailbox: v4Mailbox });
		});
	});
});
