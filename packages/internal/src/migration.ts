/** Generic rule for migration of data */
export type MigrationRule<T> = {
	/**
	 * Perform the required checks to check if migration is required for the provided `data`.
	 *
	 * Tip: better make this check fast without checking every aspect of the data because it might run multiple times.
	 * If it ends up that migration is not required, just return the same data {@link MigrationRule.apply}.
	 */
	shouldApply: (data: T) => Promise<boolean>;
	/**
	 * Perform migration of the provided `data`, making sure not to mutate the input `data`.
	 */
	apply: (data: T) => Promise<T>;
};

/** No-operation migration. Useful when no migration is required and to provide this as default. */
export function nopMigration<T>(): MigrationRule<T> {
	return {
		shouldApply: () => Promise.resolve(false),
		apply: (data) => Promise.resolve(data),
	};
}

/** Combine multiple migration rules into a single, where only required migrations will be applied. */
export function combineMigrations<T>(...migrations: MigrationRule<T>[]): MigrationRule<T> {
	return {
		shouldApply: async (data) => {
			for (const migration of migrations) {
				if (await migration.shouldApply(data)) return true;
			}
			return false;
		},
		apply: async (data) => {
			let latestData = data;
			for (const migration of migrations) {
				if (await migration.shouldApply(latestData)) {
					latestData = await migration.apply(latestData);
				}
			}
			return latestData;
		},
	};
}
