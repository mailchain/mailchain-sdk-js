export type SuccessMailchainResult<D> = {
	data: D;
	error?: undefined;
};
export type ErrorMailchainResult<E extends Error> = {
	error: E;
	data?: undefined;
};

export type MailchainResult<D, E extends Error = Error> = SuccessMailchainResult<D> | ErrorMailchainResult<E>;

export type ResultsWithParams<T, E extends Error, P> = {
	result: MailchainResult<T, E>;
	params: P;
};

export function partitionMailchainResults<T, E extends Error, P>(
	calls: ResultsWithParams<T, E, P>[],
): {
	successes: Array<{ params: P; data: T }>;
	failures: Array<{ params: P; error: E }>;
} {
	const successes: Array<{ params: P; data: T }> = [];
	const failures: Array<{ params: P; error: E }> = [];

	for (const call of calls) {
		const { result, params } = call;
		if (isErrorMailchainResult(result)) failures.push({ params, error: result.error });
		if (isSuccessMailchainResult(result)) successes.push({ params, data: result.data });
	}

	return { successes, failures };
}

function isErrorMailchainResult<T, E extends Error>(r: MailchainResult<T, E>): r is ErrorMailchainResult<E> {
	return r.error != null;
}

function isSuccessMailchainResult<T, E extends Error>(r: MailchainResult<T, E>): r is SuccessMailchainResult<T> {
	return r.data != null;
}
