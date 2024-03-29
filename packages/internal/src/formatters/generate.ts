import { publicKeyToBytes } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { createMessageComposer } from '@mailchain/message-composer';
import { MessageComposer } from '@mailchain/message-composer/messageComposer';
import { HeaderAttribute } from '@mailchain/message-composer/types';
import { ResolvedAddress } from '../messagingKeys';
import { MailAddress, MailData } from '../transport';
import { X_IDENTITY_KEYS } from './consts';

export const createMimeMessage = async (
	mailData: MailData,
	resolvedAddresses: Map<string, ResolvedAddress>,
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

	const visibleIdentityKeyAddresses = [mailData.from, ...mailData.recipients, ...mailData.carbonCopyRecipients];
	if (mailData.replyTo) {
		msg.replyTo(mailData.replyTo);
		if (visibleIdentityKeyAddresses.every((x) => x.address !== mailData.replyTo!.address)) {
			visibleIdentityKeyAddresses.push(mailData.replyTo);
		}
	}

	const msgWithIdentityAttributes = addAllIdentityKeyAttr(
		msg,
		visibleIdentityKeyAddresses,
		mailData.blindCarbonCopyRecipients,
		resolvedAddresses,
	);

	const builtMsg = await msgWithIdentityAttributes.build();

	return {
		original: builtMsg.forSender,
		visibleRecipients: builtMsg.forVisibleRecipients,
		blindRecipients: builtMsg.forBlindedRecipients.map(([recipient, content]) => ({
			recipient: { name: recipient.name!, address: recipient.address },
			content,
		})),
	};
};

function addAllIdentityKeyAttr(
	msg: MessageComposer,
	visibleIdentityKeyAddresses: MailAddress[],
	blindCarbonCopyRecipients: MailAddress[],
	resolvedAddresses: Map<string, ResolvedAddress>,
) {
	const visibleIdentityKeyAttrs: HeaderAttribute[] = [];

	// Add the X-IdentityKeys for the visible recipients
	for (const { address } of visibleIdentityKeyAddresses) {
		putIdentityKeyAttr(address, resolvedAddresses, visibleIdentityKeyAttrs);
	}
	if (visibleIdentityKeyAttrs.length > 0) {
		msg.customHeader(X_IDENTITY_KEYS, '', ['v', '1'], ...visibleIdentityKeyAttrs);
	}

	// Add the X-IdentityKeys for the blind recipients
	const allBlindIdentityKeyAttrs: HeaderAttribute[] = [];
	for (const { address } of blindCarbonCopyRecipients) {
		const bccIdentityKeyAttrs = [...visibleIdentityKeyAttrs];
		const putAttrs = putIdentityKeyAttr(address, resolvedAddresses, bccIdentityKeyAttrs);
		if (putAttrs) {
			allBlindIdentityKeyAttrs.push(...putAttrs);
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

	return msg;
}

function putIdentityKeyAttr(
	address: string,
	resolvedAddresses: Map<string, ResolvedAddress>,
	attrs: HeaderAttribute[],
): HeaderAttribute[] | undefined {
	const lookupResults = resolvedAddresses.get(address);
	if (!lookupResults || lookupResults.length === 0) return undefined;

	const putAttrs: HeaderAttribute[] = [];
	for (const lookupResult of lookupResults) {
		if (lookupResult.identityKey == null) return undefined;

		const { identityKey, protocol } = lookupResult;
		const attrValue = `${encodeHexZeroX(publicKeyToBytes(identityKey))}:${protocol}`;
		const attr: HeaderAttribute = [lookupResult.mailchainAddress, attrValue];
		putAttrs.push(attr);
	}

	attrs.push(...putAttrs);
	return putAttrs;
}
