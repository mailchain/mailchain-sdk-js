import { CRLF, HTAB, LINE_LENGTH_FOLD } from './consts';
import { createHeader } from './headerFactories';
import { exportHeader, exportHeaderAttributes, exportStringHeader } from './headerHandler';
import { defaultMessageComposerContext } from './messageComposerContext';

describe('headerHandler', () => {
	describe('exportHeader', () => {
		it('should export string header', async () => {
			const header = createHeader('Label', 'stringValue', ['key', 'value']);

			const res = await exportHeader(header, defaultMessageComposerContext());

			expect(res).toEqual(`Label: stringValue; key="value"`);
		});

		it('should export header with empty value', async () => {
			const header = createHeader('Label', '', ['key', 'value']);

			const res = await exportHeader(header, defaultMessageComposerContext());

			expect(res).toEqual(`Label: key="value"`);
		});

		it('should export date header', async () => {
			const header = createHeader('Label', new Date('01/01/2001'), ['key', 'value']);

			const res = await exportHeader(header, defaultMessageComposerContext());

			expect(res).toEqual(`Label: Mon, 01 Jan 2001 00:00:00 +0000; key="value"`);
		});

		it('should export single address header', async () => {
			const header = createHeader('Label', [{ name: 'Alice', address: 'alice@mailchain.com' }]);

			const res = await exportHeader(header, defaultMessageComposerContext());

			expect(res).toEqual(`Label: "Alice" <alice@mailchain.com>`);
		});

		it('should export multiple address header', async () => {
			const header = createHeader('Label', [
				{ name: 'Alice', address: 'alice@mailchain.co' },
				{ name: 'Bob', address: 'bob@mailchain.co' },
				{ name: 'Rob', address: 'rob@mailchain.xyz' },
			]);

			const res = await exportHeader(header, defaultMessageComposerContext());

			expect(res).toEqual(
				`Label: "Alice" <alice@mailchain.co>,${CRLF} "Bob" <bob@mailchain.co>,${CRLF} "Rob" <rob@mailchain.xyz>`,
			);
		});

		it('should export header with multiple attributes not being folded', async () => {
			const header = createHeader('Label', 'value', ['key1', 'value1'], ['key2', 'value2'], ['key3', 'value3']);

			const res = await exportHeader(header, defaultMessageComposerContext());

			expect(res).toEqual(`Label: value; key1="value1"; key2="value2"; key3="value3"`);
		});

		it('should export header with multiple attributes with attribute folded', async () => {
			const header = createHeader(
				'Label',
				'value',
				['attr-key-1', 'long-value-1'],
				['attr-key-2', 'extra-long-value-2'],
				['attr-key-3', 'very-very-very-very-very-very-long-value-that-will-get-folded-3'],
			);

			const res = await exportHeader(header, defaultMessageComposerContext());

			expect(res).toEqual(
				`Label: value; attr-key-1="long-value-1"; attr-key-2="extra-long-value-2";${CRLF}${HTAB}attr-key-3="very-very-very-very-very-very-long-value-that-will-get-folded-3"`,
			);
		});
	});

	describe('exportHeaderAttributes', () => {
		it('should export single attributes', async () => {
			const res = await exportHeaderAttributes([['key', 'value']], defaultMessageComposerContext());

			expect(res).toEqual([`key="value"`]);
		});

		it('should export multiple attributes', async () => {
			const res = await exportHeaderAttributes(
				[
					['key1', 'value1'],
					['key2', 'value2'],
				],
				defaultMessageComposerContext(),
			);

			expect(res).toEqual([`key1="value1"`, `key2="value2"`]);
		});

		it('should export attribute with non US-ASCII char value', async () => {
			const res = await exportHeaderAttributes([['key', 'валуе 🥸']], defaultMessageComposerContext());

			expect(res).toEqual([`key="=?UTF-8?B?0LLQsNC70YPQtSDwn6W4?="`]);
		});

		it('should expert attribute without key', async () => {
			const res = await exportHeaderAttributes([[undefined, 'value']], defaultMessageComposerContext());

			expect(res).toEqual([`"value"`]);
		});
	});

	describe('exportStringHeader', () => {
		it('should export simple string value', async () => {
			const res = await exportStringHeader(createHeader('', 'value'), defaultMessageComposerContext());

			expect(res).toEqual('value');
		});

		it('should semanticaly fold US-ASCII only line', async () => {
			const res = await exportStringHeader(
				createHeader(
					'Label',
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Elit ullamcorper dignissim cras tincidunt lobortis feugiat vivamus at. Blandit aliquam etiam erat velit scelerisque in dictum non. Sed viverra tellus in hac habitasse platea dictumst vestibulum. Nibh tellus molestie nunc non. Id leo in vitae turpis massa sed elementum tempus. Ante metus dictum at tempor commodo ullamcorper a lacus vestibulum. Non odio euismod lacinia at quis risus sed. Imperdiet massa tincidunt nunc pulvinar. Est ante in nibh mauris. Cursus euismod quis viverra nibh cras. Duis at tellus at urna condimentum mattis pellentesque. Amet mauris commodo quis imperdiet massa tincidunt nunc. Vitae congue mauris rhoncus aenean vel elit scelerisque mauris.',
				),
				defaultMessageComposerContext(),
			);

			res.split(CRLF).forEach((line, index) => {
				expect(line.length).toBeLessThan(LINE_LENGTH_FOLD);
				if (index > 0) {
					// every line begins with white space char
					expect(line.match(/$\s/)).toBeDefined();
				}
			});
			expect(res).toMatchSnapshot();
		});

		it('should export as UTF-8 base64 encoded', async () => {
			const res = await exportStringHeader(
				createHeader(
					'Label',
					'途回福構野市天時番児事日期保。談真望載最学書表殺祉再特後日路要人。議渡小真設俳落権数左広員意竹吸更地言。択割特図無横原油集目再晴大報用左産。活必名引大低普浜告見窓幌験井続化。世供芸負習学授戦質左改鈴述禁賠能薄。関超主点切世治磨発車議禁人政。究撃横了訴話者育的強天展調九旭撃能済。能皇臓哲天権目鹿市全求各守迎細台樸技分',
				),
				defaultMessageComposerContext(),
			);

			res.split(CRLF).forEach((line, index) => {
				expect(line.length).toBeLessThan(LINE_LENGTH_FOLD);
				line.trim().startsWith('=?UTF-8?B?');
				line.endsWith('?=');
				if (index > 0) {
					// every line begins with white space char
					expect(line.match(/$\s/)).toBeDefined();
				}
			});
			expect(res).toMatchSnapshot();
		});
	});
});
