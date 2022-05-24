import parse from 'emailjs-mime-parser';

export function parseMimeText(text) {
	const {
		childNodes,
		headers,
		headers: { from, to },
	} = parse(text);

	return {
		from: from.map((it) => it.value[0]),
		to: to.map((it) => it.value[0]),
		subject: headers['subject']?.[0].value,
		childNodes: childNodes.map((it) => ({
			raw: it.header.reduce((acc, rec) => {
				return acc.replace(rec, '');
			}, it.raw),
			header: it.header,
		})),
	};
}
