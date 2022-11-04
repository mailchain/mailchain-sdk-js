import { getBundlingConfigs } from '../library.rollup.config';
import pkg from './package.json';

export default getBundlingConfigs('crypto', pkg, { preserveModules: true });
