export enum Prefix {
	TZ1 = 'tz1',
	TZ2 = 'tz2',
	TZ3 = 'tz3',
	KT = 'KT',
	KT1 = 'KT1',

	EDSK2 = 'edsk2',
	SPSK = 'spsk',
	P2SK = 'p2sk',

	EDPK = 'edpk',
	SPPK = 'sppk',
	P2PK = 'p2pk',

	EDESK = 'edesk',
	SPESK = 'spesk',
	P2ESK = 'p2esk',

	EDSK = 'edsk',
	EDSIG = 'edsig',
	SPSIG = 'spsig',
	P2SIG = 'p2sig',
	SIG = 'sig',
	EXPR = 'expr',
}

export const prefix = {
	[Prefix.TZ1]: new Uint8Array([6, 161, 159]),
	[Prefix.TZ2]: new Uint8Array([6, 161, 161]),
	[Prefix.TZ3]: new Uint8Array([6, 161, 164]),
	[Prefix.KT]: new Uint8Array([2, 90, 121]),
	[Prefix.KT1]: new Uint8Array([2, 90, 121]),

	[Prefix.EDSK]: new Uint8Array([43, 246, 78, 7]),
	[Prefix.EDSK2]: new Uint8Array([13, 15, 58, 7]),
	[Prefix.SPSK]: new Uint8Array([17, 162, 224, 201]),
	[Prefix.P2SK]: new Uint8Array([16, 81, 238, 189]),

	[Prefix.EDPK]: new Uint8Array([13, 15, 37, 217]),
	[Prefix.SPPK]: new Uint8Array([3, 254, 226, 86]),
	[Prefix.P2PK]: new Uint8Array([3, 178, 139, 127]),

	[Prefix.EDESK]: new Uint8Array([7, 90, 60, 179, 41]),
	[Prefix.SPESK]: new Uint8Array([0x09, 0xed, 0xf1, 0xae, 0x96]),
	[Prefix.P2ESK]: new Uint8Array([0x09, 0x30, 0x39, 0x73, 0xab]),

	[Prefix.EDSIG]: new Uint8Array([9, 245, 205, 134, 18]),
	[Prefix.SPSIG]: new Uint8Array([13, 115, 101, 19, 63]),
	[Prefix.P2SIG]: new Uint8Array([54, 240, 44, 52]),
	[Prefix.SIG]: new Uint8Array([4, 130, 43]),
	[Prefix.EXPR]: new Uint8Array([13, 44, 64, 27]),
};
