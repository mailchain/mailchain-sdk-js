import { BadlyFormattedAddressError, IdentityProviderAddressInvalidError } from './errors';
import { checkAddressForErrors } from './checkAddressForErrors';

export type ValidateAddressError = BadlyFormattedAddressError | IdentityProviderAddressInvalidError;
describe('checkAddressForErrors', () => {
	describe('generic', () => {
		it('should return undefined when address is valid - alternative domain', () => {
			expect(checkAddressForErrors('alice@mailchain.local', 'mailchain.local')).toBeUndefined();
		});
		it('should return error when address is invalid - domain mismatch', () => {
			expect(checkAddressForErrors('alice@ethereum@mailchain.com', 'mailchain.local')).toEqual(
				new BadlyFormattedAddressError(),
			);
		});
		it('should return error when address is invalid - too many @', () => {
			expect(checkAddressForErrors('alice@ethereum@mailchain.com')).toEqual(new BadlyFormattedAddressError());
		});
	});

	describe('unknown', () => {
		it('should return undefined when address is for unknown identity service', () => {
			expect(checkAddressForErrors('alice@unknown.mailchain.com')).toBeUndefined();
		});
	});

	describe('mailchain protocol', () => {
		it('should return undefined when address is valid', () => {
			expect(checkAddressForErrors('alice_bob@mailchain.com')).toBeUndefined();
		});
		it('should return undefined when address is valid', () => {
			expect(checkAddressForErrors('alice@mailchain.com')).toBeUndefined();
		});
		it('should return error when address is invalid - not allow character', () => {
			expect(checkAddressForErrors('!alice@mailchain.com')).toEqual(new IdentityProviderAddressInvalidError());
		});
	});

	describe('ethereum - token address', () => {
		it('should return undefined for token', () => {
			expect(
				checkAddressForErrors('4254.0xdd69da9a83cedc730bc4d3c56e96d29acc05ecde@ethereum.mailchain.com'),
			).toBeUndefined();
		});
		it('should return undefined when address is valid', () => {
			expect(
				checkAddressForErrors('.0xdd69da9a83cedc730bc4d3c56e96d29acc05ecde@ethereum.mailchain.com'),
			).toBeUndefined();
		});
		it('should return error when address is invalid - non number', () => {
			expect(
				checkAddressForErrors('4a.0xdd69da9a83cedc730bc4d3c56e96d29acc05ecde@ethereum.mailchain.com'),
			).toEqual(new IdentityProviderAddressInvalidError());
		});
	});

	describe('ethereum', () => {
		it('should return undefined when address is valid', () => {
			expect(
				checkAddressForErrors('0x74a458c4901ed202ffa0bfe47a8b7bc8a522e210@ethereum.mailchain.com'),
			).toBeUndefined();
		});
		it('should return error when address is invalid - bad length', () => {
			expect(checkAddressForErrors('0x74a458c4901ed202ffa0bfe47a8b7bc8a522e@ethereum.mailchain.com')).toEqual(
				new IdentityProviderAddressInvalidError(),
			);
		});
		it('should return error when address is invalid - non hex', () => {
			expect(checkAddressForErrors('0xNOT_HEX4901ed202ffa0bfe47a8b7bc8a522e210@ethereum.mailchain.com')).toEqual(
				new IdentityProviderAddressInvalidError(),
			);
		});
	});

	describe('near-named', () => {
		it('should return undefined when address is valid', () => {
			expect(checkAddressForErrors('alice.near@near.mailchain.com')).toBeUndefined();
		});
		it('should return undefined when address is valid', () => {
			expect(checkAddressForErrors('bills.alice.near@near.mailchain.com')).toBeUndefined();
		});
	});

	describe('near-implicit', () => {
		it('should return undefined when address is valid', () => {
			expect(
				checkAddressForErrors(
					'b5add8415bb5594102114f60eaf7287f1aa5a31db5ac8f795238998891d1b49c@near.mailchain.com',
				),
			).toBeUndefined();
		});
		it('should return error when address is invalid - invalid length', () => {
			expect(
				checkAddressForErrors(
					'1b5add8415bb5594102114f60eaf7287f1aa5a31db5ac8f795238998891d1b49c@near.mailchain.com',
				),
			).toEqual(new IdentityProviderAddressInvalidError());
		});
		it('should return error when address is invalid - invalid base58', () => {
			expect(
				checkAddressForErrors(
					'0Oadd8415bb5594102114f60eaf7287f1aa5a31db5ac8f795238998891d1b49c@near.mailchain.com',
				),
			).toEqual(new IdentityProviderAddressInvalidError());
		});
	});

	describe('tezos', () => {
		it('should return undefined when address is valid - tz1', () => {
			expect(checkAddressForErrors('tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV@tezos.mailchain.com')).toBeUndefined();
		});
		it('should return undefined when address is valid - tz2', () => {
			expect(checkAddressForErrors('tz2ToZF5fjmcawoUQUa6NoV3jsRmmZNwuEyZ@tezos.mailchain.com')).toBeUndefined();
		});
		it('should return undefined when address is valid - tz3', () => {
			expect(checkAddressForErrors('tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At@tezos.mailchain.com')).toBeUndefined();
		});

		it('should return error when address is invalid - incorrect prefix', () => {
			expect(checkAddressForErrors('tz9Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At@tezos.mailchain.com')).toEqual(
				new IdentityProviderAddressInvalidError(),
			);
		});
		it('should return error when address is invalid - incorrect checksum', () => {
			expect(checkAddressForErrors('tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59a2@tezos.mailchain.com')).toEqual(
				new IdentityProviderAddressInvalidError(),
			);
		});
		it('should return error when address is invalid - invalid base58', () => {
			expect(checkAddressForErrors('tz30Om6CyfSTZ7EgMckptZZGiPxzs9GK59At@tezos.mailchain.com')).toEqual(
				new IdentityProviderAddressInvalidError(),
			);
		});
	});

	describe('filecoin', () => {
		it('should return undefined when address is valid - tz1', () => {
			expect(
				checkAddressForErrors('f410f2oekwcmo2pueydmaq53eic2i62crtbeyuzx2gmy@filecoin.mailchain.com'),
			).toBeUndefined();
		});

		it('should return error when address is invalid - incorrect prefix', () => {
			expect(
				checkAddressForErrors('fz11faiikgixcdd7alrsbpunjlen4etkcarbfbghn7wi@filecoin.mailchain.com'),
			).toEqual(new IdentityProviderAddressInvalidError());
		});
		it('should return error when address is invalid - incorrect length', () => {
			expect(
				checkAddressForErrors(
					'f410f2oekwcmo2pueydmaq53eic2i62crtbeyuzx2gmyhn7arbfbghn7wi@filecoin.mailchain.com',
				),
			).toEqual(new IdentityProviderAddressInvalidError());
		});
		it('should return error when address is invalid - invalid base58', () => {
			expect(
				checkAddressForErrors('f410f20Okwcmo2pueydmaq53eic2i62crtbeyuzx2gmy@filecoin.mailchain.com'),
			).toEqual(new IdentityProviderAddressInvalidError());
		});
	});
});
