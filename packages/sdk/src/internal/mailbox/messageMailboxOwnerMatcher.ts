import { MailchainAddress, parseNameServiceAddress } from '@mailchain/addressing';
import { isPublicKeyEqual } from '@mailchain/crypto';
import uniqBy from 'lodash/uniqBy';
import { ParseMimeTextResult } from '../formatters/parse';
import { IdentityKeys } from '../identityKeys';
import { UserMailbox } from '../user/types';
import { Configuration } from '../../mailchain';
import { MailData } from '../transport';
import {
	AddressIdentityKeyResolver,
	createMailchainApiAddressIdentityKeyResolver,
	createMessageHeaderIdentityKeyResolver,
} from './addressIdentityKeyResolver';

/** Result of the {@link MessageMailboxOwnerMatcher.findMatches}. */
export type AddressMatch = {
	/** The matched address */
	address: MailchainAddress;
	/** How this address was matched */
	matchBy: 'fallback' | 'message-header' | 'mailchain-api';
};

export class MessageMailboxOwnerMatcher {
	constructor(
		private readonly addressIdentityKeyResolvers: [AddressMatch['matchBy'], AddressIdentityKeyResolver][],
	) {}

	/** Create {@link MessageMailboxOwnerMatcher} with {@link createMailchainApiAddressIdentityKeyResolver} as default resolver.  */
	static create(config: Configuration) {
		const identityKeys = IdentityKeys.create(config);
		return new MessageMailboxOwnerMatcher([
			['mailchain-api', createMailchainApiAddressIdentityKeyResolver(identityKeys)],
		]);
	}

	/**
	 * Build new {@link MessageMailboxOwnerMatcher} with an additional identity key resolver {@link createMessageHeaderIdentityKeyResolver}.
	 *
	 * Note: this doesn't modify the original {@link MessageMailboxOwnerMatcher}.
	 */
	withMessageIdentityKeys(
		addressIdentityKeys: ParseMimeTextResult['addressIdentityKeys'],
	): MessageMailboxOwnerMatcher {
		const resolver = createMessageHeaderIdentityKeyResolver(addressIdentityKeys);
		return new MessageMailboxOwnerMatcher([['message-header', resolver], ...this.addressIdentityKeyResolvers]);
	}

	/** Find the matching {@link Alias} from the provided `mailData` that match to the `userMailbox`. */
	async findMatches(mailData: MailData, userMailbox: UserMailbox): Promise<AddressMatch[]> {
		const allRecipients = uniqBy(
			[...mailData.recipients, ...mailData.carbonCopyRecipients, ...mailData.blindCarbonCopyRecipients],
			(r) => r.address,
		);

		const matches: AddressMatch[] = [];
		for (const recipient of allRecipients) {
			const address = parseNameServiceAddress(recipient.address);
			for (const [matchBy, resolver] of this.addressIdentityKeyResolvers) {
				const result = await resolver(address);
				if (result != null && isPublicKeyEqual(result.identityKey, userMailbox.identityKey)) {
					matches.push({ address: parseNameServiceAddress(recipient.address), matchBy });
					break; // found a match for this recipient, break the resolvers loop
				}
			}
		}

		if (matches.length === 0) {
			return [{ address: userMailbox.aliases[0].address, matchBy: 'fallback' }];
		}

		return matches;
	}
}
