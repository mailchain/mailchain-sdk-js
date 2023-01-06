import { getBundlingConfigs } from '../../../library.rollup.config';
import pkg from './package.json';

// eslint-disable-next-line import/no-default-export
export default getBundlingConfigs('addressing', pkg);
