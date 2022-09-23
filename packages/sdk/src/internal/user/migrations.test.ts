import { encodePublicKey } from '@mailchain/crypto';
import { AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { encodeHexZeroX } from '@mailchain/encoding';
import { AxiosResponse } from 'axios';
import { mock, MockProxy } from 'jest-mock-extended';
import { AliceSECP256K1PublicAddress } from '../ethereum/test.const';
import { AddressesApiInterface, GetIdentityKeyResponseBody } from '../api';
import { user } from '../protobuf/user/user';
import { createV1V2IdentityKeyMigration, UserMailboxMigrationRule } from './migrations';

describe('UserProfile migrations', () => {
	describe('v1 to v2 - IdentitKey', () => {
		let addressesApi: MockProxy<AddressesApiInterface>;
		let migration: UserMailboxMigrationRule;

		const v1Mailbox = user.Mailbox.create({
			address: AliceSECP256K1PublicAddress,
			nonce: 1,
			protocol: 'ethereum',
			network: 'main',
		});

		beforeEach(() => {
			addressesApi = mock();
			migration = createV1V2IdentityKeyMigration(addressesApi, 'mailchain.test');
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
			addressesApi.getAddressIdentityKey.mockResolvedValueOnce({
				data: { identityKey: encodeHexZeroX(encodePublicKey(AliceSECP256K1PublicKey)) },
			} as AxiosResponse<GetIdentityKeyResponseBody>);

			const migrated = await migration.apply({ version: 1, protoMailbox: v1Mailbox });

			expect(migrated).toEqual({
				version: 2,
				protoMailbox: user.Mailbox.create({
					...v1Mailbox,
					identityKey: encodePublicKey(AliceSECP256K1PublicKey),
				}),
			});
		});
	});
});