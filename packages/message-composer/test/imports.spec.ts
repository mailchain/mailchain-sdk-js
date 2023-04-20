import path from 'path';
import { getImportsFromDir } from '../../../../collect-imports';
import pckg from '../package.json';

describe('check imports snapshot', () => {
	const imports = [
		...new Set(
			getImportsFromDir(path.resolve(`${__dirname}`, '..'), ['.ts', '.js']).filter((it) =>
				it.startsWith(pckg.name),
			),
		),
	].sort();
	test('compare imports', () => {
		expect(imports).toMatchSnapshot('imports');
	});
});
