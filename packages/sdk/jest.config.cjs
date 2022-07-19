const path = require('path');
const { createConfig } = require('../../jest.base.config.cjs');

module.exports = {
	...createConfig(path.join(__dirname, '..', '..', 'packages')),
	setupFilesAfterEnv: ['./jest.setup.js'],
};
