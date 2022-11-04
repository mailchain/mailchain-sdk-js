import { getBundlingConfigs } from '../library.rollup.config';
import pkg from './package.json';

export default getBundlingConfigs('addressing', pkg);
