import { Configuration as APIConfiguration } from '../api/configuration';

export function createAxiosConfiguration(apiPath: string): APIConfiguration {
	return new APIConfiguration({
		basePath: apiPath,
	});
}
