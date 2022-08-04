import { Configuration } from '../mailchain';
import { Configuration as APIConfiguration } from '../api/configuration';

export function createAxiosConfiguration(config: Configuration): APIConfiguration {
	return new APIConfiguration({
		basePath: config.apiPath,
	});
}
