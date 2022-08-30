import { decodeUtf8, encodeBase64 } from '@mailchain/encoding';
import { createHeader } from './headerFactories';
import { ContentPart } from './types';
import { buildContentPart, buildContentParts, buildMessageAndAttachments } from './contentHandler';
import { defaultMessageComposerContext, MessageComposerContext } from './messageComposerContext';
import { HEADER_LABELS } from './consts';

const sampleTextContent1 =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Elit ullamcorper dignissim cras tincidunt lobortis feugiat vivamus at. Blandit aliquam etiam erat velit scelerisque in dictum non. Sed viverra tellus in hac habitasse platea dictumst vestibulum. Nibh tellus molestie nunc non. Id leo in vitae turpis massa sed elementum tempus. Ante metus dictum at tempor commodo ullamcorper a lacus vestibulum. Non odio euismod lacinia at quis risus sed. Imperdiet massa tincidunt nunc pulvinar. Est ante in nibh mauris. Cursus euismod quis viverra nibh cras. Duis at tellus at urna condimentum mattis pellentesque. Amet mauris commodo quis imperdiet massa tincidunt nunc. Vitae congue mauris rhoncus aenean vel elit scelerisque mauris.';
const sampleContentPart1: ContentPart = {
	headers: [createHeader('Label1', 'value1', [['attrKey1', 'attrValue1']])],
	content: encodeBase64(decodeUtf8(sampleTextContent1)),
};
const sampTextContent2 =
	'Neque sodales ut etiam sit. Et egestas quis ipsum suspendisse. Scelerisque felis imperdiet proin fermentum leo. Neque convallis a cras semper auctor neque vitae tempus. Libero volutpat sed cras ornare arcu dui vivamus arcu felis. In nisl nisi scelerisque eu ultrices vitae auctor. In eu mi bibendum neque egestas. Sed tempus urna et pharetra pharetra massa massa. Augue lacus viverra vitae congue eu consequat ac felis. Pellentesque diam volutpat commodo sed egestas egestas. Donec pretium vulputate sapien nec sagittis aliquam malesuada bibendum. Amet justo donec enim diam vulputate ut pharetra.';
const sampleContentPart2: ContentPart = {
	headers: [createHeader('Label2', 'Value2', [['atrrKey2', 'attrValue2']])],
	content: encodeBase64(decodeUtf8(sampTextContent2)),
};

describe('contentHandler', () => {
	let messageComposerContext: MessageComposerContext;

	beforeEach(() => {
		messageComposerContext = {
			...defaultMessageComposerContext(),
			random: jest
				.fn()
				.mockReturnValueOnce(new Uint8Array([1, 2, 3]))
				.mockReturnValueOnce(new Uint8Array([4, 5, 6]))
				.mockReturnValueOnce(new Uint8Array([7, 8, 9])),
		};
	});

	describe('buildContentPart', () => {
		it('should build pre-encoded base64 content', async () => {
			const res = await buildContentPart(sampleContentPart1, messageComposerContext);

			expect(res).toMatchSnapshot();
		});

		it('should build buffer of bytes', async () => {
			const contentPart: ContentPart = {
				headers: [createHeader('Label', 'value', [['attrName', 'attrValue']])],
				content: Buffer.from(decodeUtf8(sampleTextContent1)),
			};

			const res = await buildContentPart(contentPart, messageComposerContext);

			expect(res).toMatchSnapshot();
		});
	});

	describe('buildContentParts', () => {
		it('should build single part without boundary', async () => {
			const res = await buildContentParts([sampleContentPart1], false, messageComposerContext);

			expect(res).toMatchSnapshot();
		});

		it('should build multiple parts with boundary', async () => {
			const res = await buildContentParts(
				[sampleContentPart1, sampleContentPart2],
				false,
				messageComposerContext,
			);

			if (typeof res === 'string') throw new Error('should be object');
			expect(res.boundary).toBeDefined();
			expect(res.parts).toMatchSnapshot();
			expect(res.parts.match(new RegExp(`--${res.boundary}`, 'g'))).toHaveLength(3);
		});

		it('should build single part with boundary', async () => {
			const res = await buildContentParts([sampleContentPart1], true, messageComposerContext);
			if (typeof res === 'string') throw new Error('should be object');

			expect(res.parts).toMatchSnapshot();
			expect(res.parts.match(new RegExp(`--${res.boundary}`, 'g'))).toHaveLength(2);
		});
	});

	describe('buildMessageAndAttachments', () => {
		it('should build just single message part without boundary', async () => {
			const res = await buildMessageAndAttachments([sampleContentPart1], [], messageComposerContext);

			expect(typeof res).toEqual('string');
			expect((res as string).match(/--/g)).toBeNull(); // no boundaryies in the content
			expect(res).toMatchSnapshot();
		});

		it('should build just message with alternative content', async () => {
			const res = await buildMessageAndAttachments(
				[sampleContentPart1, sampleContentPart2],
				[],
				messageComposerContext,
			);

			if (typeof res === 'string') throw new Error('should be object');
			expect(res.boundaryHeader.label).toEqual(HEADER_LABELS.ContentType);
			expect(res.boundaryHeader.value).toEqual('multipart/alternative');
			expect(res.boundaryHeader.attrs![0]).toEqual(['boundary', 'AQID']); // AQID is the frist mock random ID of [1,2,3]
			expect(res.content.match(/--AQID/g)).toHaveLength(3);
			expect(res.content).toMatchSnapshot();
		});

		it('should build message and attachment without alternative content', async () => {
			const res = await buildMessageAndAttachments(
				[sampleContentPart1],
				[sampleContentPart1],
				messageComposerContext,
			);

			if (typeof res === 'string') throw new Error('should be object');
			expect(res.boundaryHeader.label).toEqual(HEADER_LABELS.ContentType);
			expect(res.boundaryHeader.value).toEqual('multipart/mixed');
			expect(res.boundaryHeader.attrs![0]).toEqual(['boundary', 'AQID']); // AQID is the frist mock random ID of [1,2,3]
			expect(res.content.match(/--AQID/g)).toHaveLength(3);
			expect(res.content).toMatchSnapshot();
		});
		it('should build message and attachment with alternative content', async () => {
			const res = await buildMessageAndAttachments(
				[sampleContentPart1, sampleContentPart1],
				[sampleContentPart2],
				messageComposerContext,
			);

			if (typeof res === 'string') throw new Error('should be object');
			expect(res.boundaryHeader.label).toEqual(HEADER_LABELS.ContentType);
			expect(res.boundaryHeader.value).toEqual('multipart/mixed');
			expect(res.boundaryHeader.attrs![0]).toEqual(['boundary', 'BAUG']); // BAUG is the second mock random ID of [4,5,6]
			expect(res.content.match(/--AQID/g)).toHaveLength(3);
			expect(res.content.match(/--BAUG/g)).toHaveLength(3);
			expect(res.content).toMatchSnapshot();
		});
	});
});
