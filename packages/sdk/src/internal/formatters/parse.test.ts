import { readFileSync } from 'fs';
import { parseMimeText } from './parse';

describe('parse', () => {
	it('should handle legacy message content and subject', async () => {
		const legacyContent = readFileSync(__dirname + '/__tests__/legacy-content-and-subject.eml').toString();

		const result = await parseMimeText(Buffer.from(legacyContent));

		expect(result.mailData).toMatchSnapshot();
	});
});
