import { mock, MockProxy } from 'jest-mock-extended';
import { formatAddress, MAILCHAIN } from '@mailchain/addressing';
import { encodePublicKey, secureRandom } from '@mailchain/crypto';
import { IdentityKeys } from '../../identityKeys';
import * as protoInbox from '../protobuf/inbox/inbox';
import { AliceAccountMailbox, AliceWalletMailbox, BobAccountMailbox } from '../user/test.const';
import { dummyMailData } from '../test.const';
import { createV2IdentityKey, createV3EncodeIdentityKey, MessagePreviewMigrationRule } from './migrations';

describe('MailboxOperations migrations', () => {
	let migration: MessagePreviewMigrationRule;

	const v1Message = protoInbox.preview.MessagePreview.create({
		from: formatAddress(BobAccountMailbox.aliases[0].address, 'mail'),
		subject: dummyMailData.subject,
		snippet: dummyMailData.plainTextMessage,
		hasAttachment: false,
		timestamp: 1337,
		to: dummyMailData.recipients.map((a) => a.address),
		cc: dummyMailData.carbonCopyRecipients.map((a) => a.address),
		bcc: dummyMailData.blindCarbonCopyRecipients.map((a) => a.address),
		owner: formatAddress(AliceAccountMailbox.aliases[0].address, 'mail'),
	});
	const v2Message = protoInbox.preview.MessagePreview.create({
		...v1Message,
		mailbox: AliceAccountMailbox.identityKey.bytes,
	});
	const v3Message = protoInbox.preview.MessagePreview.create({
		...v1Message,
		mailbox: encodePublicKey(AliceAccountMailbox.identityKey),
	});

	describe('V1 -> V2 - add mailbox identity key', () => {
		let identityKeys: MockProxy<IdentityKeys>;

		beforeEach(() => {
			identityKeys = mock();
			migration = createV2IdentityKey(identityKeys);
		});

		it('should should apply for V1 and add the identity key', async () => {
			identityKeys.getAddressIdentityKey.mockResolvedValue({
				identityKey: AliceAccountMailbox.identityKey,
				protocol: MAILCHAIN,
			});

			const shouldApply = await migration.shouldApply({ version: 1, messagePreview: v1Message });
			expect(shouldApply).toBe(true);

			const migrated = await migration.apply({ version: 1, messagePreview: v1Message });

			expect(migrated).toEqual({ version: 2, messagePreview: v2Message });
		});

		it('should fail migration when identity key is not found', async () => {
			identityKeys.getAddressIdentityKey.mockResolvedValue(null);

			const shouldApply = await migration.shouldApply({ version: 1, messagePreview: v1Message });
			expect(shouldApply).toBe(true);

			expect(() => migration.apply({ version: 1, messagePreview: v1Message })).rejects.toThrow();
		});
	});

	describe('V2 -> V3 - encode the mailbox identity key', () => {
		beforeEach(() => {
			migration = createV3EncodeIdentityKey();
		});

		it('should encode the mailbox ED25519 identity key', async () => {
			const shouldApply = await migration.shouldApply({ version: 2, messagePreview: v2Message });
			expect(shouldApply).toBe(true);

			const migrated = await migration.apply({ version: 2, messagePreview: v2Message });

			expect(migrated).toEqual({ version: 3, messagePreview: v3Message });
		});

		it('should encode the mailbox SECP256 identity key', async () => {
			const altV2Message = protoInbox.preview.MessagePreview.create({
				...v2Message,
				owner: formatAddress(AliceWalletMailbox.aliases[0].address, 'mail'),
				mailbox: AliceWalletMailbox.identityKey.bytes,
			});
			const shouldApply = await migration.shouldApply({ version: 2, messagePreview: altV2Message });
			expect(shouldApply).toBe(true);

			const migrated = await migration.apply({ version: 2, messagePreview: altV2Message });

			expect(migrated).toEqual({
				version: 3,
				messagePreview: protoInbox.preview.MessagePreview.create({
					...v3Message,
					owner: formatAddress(AliceWalletMailbox.aliases[0].address, 'mail'),
					mailbox: encodePublicKey(AliceWalletMailbox.identityKey),
				}),
			});
		});

		it('should fail for invalid ED25519 public key length', async () => {
			const altV2Message = protoInbox.preview.MessagePreview.create({
				...v2Message,
				mailbox: secureRandom(62),
			});

			expect(() => migration.apply({ version: 2, messagePreview: altV2Message })).rejects.toThrow();
		});

		it('should fail for ED25519 length but not mailchain address', async () => {
			const altV2Message = protoInbox.preview.MessagePreview.create({
				...v2Message,
				owner: formatAddress(AliceWalletMailbox.aliases[0].address, 'mail'),
			});

			expect(() => migration.apply({ version: 2, messagePreview: altV2Message })).rejects.toThrow();
		});

		it('should fail for invalid SECP256K1 public key length', async () => {
			const altV2Message = protoInbox.preview.MessagePreview.create({
				...v2Message,
				owner: formatAddress(AliceWalletMailbox.aliases[0].address, 'mail'),
				mailbox: secureRandom(62),
			});

			expect(() => migration.apply({ version: 2, messagePreview: altV2Message })).rejects.toThrow();
		});
	});
});
