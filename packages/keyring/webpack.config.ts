import { getBrowserLibraryConfig, getNodeLibraryConfig } from '../../scripts/library.webpack.config';
import { dependencies } from './package.json';

const libraryDetails = {
	name: 'keyring',
	type: 'umd',
};

const externals = Object.keys(dependencies)
	.filter((x) => x.startsWith('@mailchain'))
	.reduce((acc, rec) => {
		return { ...acc, [rec]: rec };
	}, {});

const configs = [getNodeLibraryConfig(libraryDetails, externals), getBrowserLibraryConfig(libraryDetails, externals)];
// eslint-disable-next-line import/no-default-export
export default configs;
