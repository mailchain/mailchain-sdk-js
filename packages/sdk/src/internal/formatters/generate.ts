import { encodePublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { createMessageComposer } from '@mailchain/message-composer';
import { HeaderAttribute } from '@mailchain/message-composer/types';
import { LookupResult } from '../identityKeys';
import { X_IDENTITY_KEYS } from './conts';
import { MailAddress, MailData } from './types';

export const createMimeMessage = async (
	mailData: MailData,
	resolvedAddresses: Map<string, LookupResult>,
): Promise<{
	original: string;
	visibleRecipients: string;
	blindRecipients: { recipient: MailAddress; content: string }[];
}> => {
	const msg = createMessageComposer()
		.id(mailData.id)
		.date(mailData.date)
		.subject(mailData.subject)
		.from(mailData.from)
		.recipients('To', ...mailData.recipients)
		.recipients('Cc', ...mailData.carbonCopyRecipients)
		.recipients('Bcc', ...mailData.blindCarbonCopyRecipients)
		.message('html', Buffer.from(mailData.message))
		.message('plain', Buffer.from(mailData.plainTextMessage));

	const visibleIdentityKeyAttrs: HeaderAttribute[] = [];
	const visibleIdentityKeyAddresses = [mailData.from, ...mailData.recipients, ...mailData.carbonCopyRecipients];

	if (mailData.replyTo) {
		msg.replyTo(mailData.replyTo);
		visibleIdentityKeyAddresses.push(mailData.replyTo);
	}

	// Add the X-IdentityKeys for the visible recipients
	for (const { address } of visibleIdentityKeyAddresses) {
		putIdentityKeyAttr(address, resolvedAddresses, visibleIdentityKeyAttrs);
	}
	if (visibleIdentityKeyAttrs.length > 0) {
		msg.customHeader(X_IDENTITY_KEYS, '', ['v', '1'], ...visibleIdentityKeyAttrs);
	}

	// Add the X-IdentityKeys for the blind recipients
	const allBlindIdentityKeyAttrs: HeaderAttribute[] = [];
	for (const { address } of mailData.blindCarbonCopyRecipients) {
		const bccIdentityKeyAttrs = [...visibleIdentityKeyAttrs];
		const putAttr = putIdentityKeyAttr(address, resolvedAddresses, bccIdentityKeyAttrs);
		if (putAttr) {
			allBlindIdentityKeyAttrs.push(putAttr);
			msg.overrideBccHeader(address, X_IDENTITY_KEYS, '', ['v', '1'], ...bccIdentityKeyAttrs);
		}
	}

	// Add ALL (incl. bcc) the X-IdentityKeys for the sender
	if (allBlindIdentityKeyAttrs.length > 0) {
		msg.overrideSenderHeader(
			X_IDENTITY_KEYS,
			'',
			['v', '1'],
			...visibleIdentityKeyAttrs,
			...allBlindIdentityKeyAttrs,
		);
	}

	const builtMsg = await msg.build();

	return {
		original: builtMsg.forSender,
		visibleRecipients: builtMsg.forVisibleRecipients,
		blindRecipients: builtMsg.forBlindedRecipients.map(([recipient, content]) => ({
			recipient: { name: recipient.name!, address: recipient.address },
			content,
		})),
	};
};

function putIdentityKeyAttr(
	address: string,
	resolvedAddresses: Map<string, LookupResult>,
	attrs: HeaderAttribute[],
): HeaderAttribute | undefined {
	const lookupResult = resolvedAddresses.get(address);
	if (lookupResult?.identityKey != null) {
		const { identityKey, protocol } = lookupResult;
		const attrValue = `${encodeHexZeroX(encodePublicKey(identityKey))}:${protocol}`;
		const attr: HeaderAttribute = [address, attrValue];
		attrs.push(attr);
		return attr;
	}
	return undefined;
}
