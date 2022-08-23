import getLibraryConfig from '../../scripts/library.webpack.config';
import { dependencies } from './package.json';

const libraryDetails = {
	name: 'addressing',
	type: 'umd',
};

const externals = Object.keys(dependencies)
	.filter((x) => x.startsWith('@mailchain'))
	.reduce((acc, rec) => {
		return { ...acc, [rec]: rec };
	}, {});

export default getLibraryConfig(libraryDetails, externals);
