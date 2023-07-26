import { isSameAddress } from './addressComparison';

const positiveCases: {
	a: string;
	b: string;
}[] = [
	// Mailchain
	{
		a: 'alice@mailchain.com',
		b: 'AlIcE@maIlChain.Com',
	},
	{
		a: 'ALICE@MAILCHAIN.TEST',
		b: 'alice@mailchain.test',
	},
	// Ethereum
	{
		a: '0x251F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mailchain.test',
		b: '0x251f7846728c3a271c930afd6c4353a43c3cfe56@EtHeReUm.MaIlChaIn.tEsT',
	},
	// Near
	{
		a: 'alice.near@near.mailchain.com',
		b: 'AlIcE.nEaR@NeAr.MaIlChaIn.CoM',
	},
	{
		a: '98793CD91A3F870FB126F66285808C7E094AFCFC4EDA8A970F6648CDF0DBD6DE@near.mailchain.test',
		b: '98793CD91A3F870fb126F66285808C7E094AFCFC4EDA8A970F6648CDF0dBD6de@near.mailchain.test',
	},
	// Tezos
	{
		a: 'tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV@tezos.mailchain.test',
		b: 'tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV@tEzOS.mAilChain.TeSt',
	},
	{
		a: 'tz2ToZF5fjmcawoUQUa6NoV3jsRmmZNwuEyZ@tezos.mailchain.test',
		b: 'tz2ToZF5fjmcawoUQUa6NoV3jsRmmZNwuEyZ@tEzOS.mAilChain.TeSt',
	},
	{
		a: 'tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At@tezos.mailchain.test',
		b: 'tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At@tEzOS.mAilChain.TeSt',
	},
	// NS Address
	{
		a: 'alice.eth@mailchain.test',
		b: 'AlIcE.eTH@MaIlChAin.TeSt',
	},
];

test.each(positiveCases)('should return true when comparing $a and $b', ({ a, b }) => {
	expect(isSameAddress(a, b)).toEqual(true);
});

const negativeCases: {
	a: string;
	b: string;
}[] = [
	// Mailchain
	{
		a: 'alice@mailchain.com',
		b: 'allice@mailchain.com',
	},
	{
		a: 'alice@mailchain.com',
		b: 'alice@eth.mailchain.com',
	},
	{
		a: 'alice@mailchain.com',
		b: 'alice@maiIchain.com',
	},
	// Ethereum
	{
		a: '0x151F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mailchain.test',
		b: '0x251F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mailchain.test',
	},
	{
		a: '0x251F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mainnet.mailchain.test',
		b: '0x251F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mailchain.test',
	},
	// Near
	{
		a: 'alice.near@near.mailchain.com',
		b: 'allice.near@Nnear.mailchain.com',
	},
	{
		a: '98793CD91A3F870F8126F66285808C7E094AFCFC4EDA8A970F6648CDF0DBD6DE@near.mailchain.test',
		b: '98793CD91A3F870FB126F66285808C7E094AFCFC4EDA8A970F6648CDF0DBD6DE@near.mailchain.test',
	},
	// Tezos
	{
		a: 'tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV@tezos.mailchain.test',
		b: 'TZ1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV@tezos.mailchain.test',
	},
	{
		a: 'tz2ToZF5fjmcawoUQUa6NoV3jsRmmZNwuEyZ@tezos.mailchain.test',
		b: 'tz2ToZf5fjmcawoUQUa6NoV3jsRmmZNwuEyZ@tezos.mailchain.test',
	},
	{
		a: 'tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At@tezos.mailchain.test',
		b: 'tz3Lfm6CyfSTZ7EgMckptZZGiPxzs5GK59At@tezos.mailchain.test',
	},
	// Mixed
	{
		a: '0x151F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mailchain.test',
		b: 'alice@mailchain.com',
	},
	{
		a: '0x151F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mailchain.test',
		b: '98793CD91A3F870F8126F66285808C7E094AFCFC4EDA8A970F6648CDF0DBD6DE@near.mailchain.test',
	},
	{
		a: '0x151F7846728c3a271c930AFD6c4353a43c3Cfe56@ethereum.mailchain.test',
		b: 'tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV@tezos.mailchain.test',
	},
	// NS Address
	{
		a: 'alice.eth@mailchain.test',
		b: 'allice.eth@mailchain.test',
	},
];

test.each(negativeCases)('should return false when comparing $a and $b', ({ a, b }) => {
	expect(isSameAddress(a, b)).toEqual(false);
});
