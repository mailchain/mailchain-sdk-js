import { getBundlingConfigs } from '../../../library.rollup.config';
import pkg from './package.json';
import { explicitExports } from './rollup.const';

export default getBundlingConfigs('sdk', pkg, { explicitExports });
