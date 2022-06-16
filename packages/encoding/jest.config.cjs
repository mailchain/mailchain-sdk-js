const { createConfig } = require('../../jest.base.config.cjs');
const path = require('path');

module.exports = {
	...createConfig(path.join(__dirname, '..', '..', 'packages')),
	setupFilesAfterEnv: ['./jest.setup.js'],
};
