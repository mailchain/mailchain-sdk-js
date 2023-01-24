import { dummyMailData, dummyMailDataResolvedAddresses } from '../test.const';
import { createMimeMessage } from './generate';

describe('createMimeMessage', () => {
	it('should generate mail message', async () => {
		const messages = await createMimeMessage(dummyMailData, dummyMailDataResolvedAddresses);

		expect(removeRandomBoundaries(messages.original)).toMatchSnapshot('ORIGINAL');
		expect(removeRandomBoundaries(messages.visibleRecipients)).toMatchSnapshot('VISIBLE');
		expect(removeRandomBoundaries(messages.blindRecipients[0].content)).toMatchSnapshot(
			`BLIND ${dummyMailData.blindCarbonCopyRecipients[0].address}`,
		);
		expect(removeRandomBoundaries(messages.blindRecipients[1].content)).toMatchSnapshot(
			`BLIND ${dummyMailData.blindCarbonCopyRecipients[1].address}`,
		);
	});
});

function removeRandomBoundaries(msg: string): string {
	msg = msg.replaceAll(/boundary.*/g, `boundary="boundary"`);
	msg = msg.replaceAll(/--.*/g, `--boundary`);

	return msg;
}
