import { combineMigrations, nopMigration, MigrationRule } from './migration';

describe('migration', () => {
	it('should return false for should apply when none of the migration rules require it', async () => {
		const shouldApply = await combineMigrations(nopMigration(), nopMigration(), nopMigration()).shouldApply(0);

		expect(shouldApply).toBe(false);
	});

	it('should return true for shouldApply when even single migration rule requires it', async () => {
		const shouldApply = await combineMigrations(
			nopMigration(),
			{ ...nopMigration(), shouldApply: () => Promise.resolve(true) },
			nopMigration(),
		).shouldApply(0);

		expect(shouldApply).toBe(true);
	});

	it('should apply migration only of the rules that require it', async () => {
		const migration = combineMigrations<number>(
			nopMigration(),
			incrementNumberMigration(false),
			incrementNumberMigration(true),
			incrementNumberMigration(true),
			incrementNumberMigration(false),
		);

		const shouldApply = await migration.shouldApply(0);
		const migrated = await migration.apply(0);

		expect(shouldApply).toEqual(true);
		expect(migrated).toEqual(2);
	});
});

function incrementNumberMigration(shouldApply: boolean): MigrationRule<number> {
	return {
		shouldApply: () => Promise.resolve(shouldApply),
		apply: (data) => Promise.resolve(data + 1),
	};
}
