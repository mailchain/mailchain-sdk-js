export type SuccessMailchainResult<D> = {
	data: D;
	error?: undefined;
};
export type ErrorMailchainResult<E extends Error> = {
	error: E;
	data?: undefined;
};

export type MailchainResult<D, E extends Error = Error> = SuccessMailchainResult<D> | ErrorMailchainResult<E>;
