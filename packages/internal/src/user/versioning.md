# UserProfile versioning

## UserMailbox versioning

## Glossary

-   `ProtoUserMailbox` - the protobuf representation of of the message `protoInbox.preview.MessagePreview`

### Version 1 (default) - initial

Initially this object was refereed as `UserAddress` and was defined as such that it represented a single wallet address.

### Version 2 - changed to `UserMailbox` and `identityKey` got added

Around this time we introduced the notion of `UserMailbox` and the source of truth to be the Identity Key of the mailbox. Single mailbox (identity key) will be possible to receive and send messages from different addresses.

-   `ProtoUserMailbox`
    -   ADDED `identityKey` field that has encoded public key of `UserMailbox.identityKey`

### Version 3 - `label` got added

Since the mailbox is represented by `identityKey` we defined a `label` that the user can use to identity this mailbox in the application

-   `ProtoUserMailbox`
    -   ADDED `label` optional field that stores the user preferred label. If `null` no user preference is set, the application is free to chose what to display in this case

### Version 4 - `aliases`

For the purposes of offering better user experience for when the users want to send/receive messages from addresses different then the one stored in the `ProtoUserMailbox.address` (for example via their registered ENS names), we introduced the `ProtoUserMailbox.aliases`.

-   `ProtoUserMailbox` - ADDED `aliases` array field that stores each aliases for sending/receiving messages for the mailbox.

### Version 5 - nameservice aliases

Not data structural changes in this version, it is migration version that tries to reverse resolve the nameservice names for all of the user mailboxes.

### Version 5 legacy - legacy alias address format

We decided to change the address format for NS addresses to include the NS name. The migrator v4-v5 also was adding the legacy format, the implementation has been updated to use the new format so there is no need to run the v6 migration for these addresses (less error prone and more accurate).

-   `alice.eth@mailchain.com` into `alice.eth@ens.mailchain.com`
-   `alice.crypto@mailchain.com` into `alice.crypto@unstoppable.com`

This "legacy" annotated version represents this alias format.

### Version 6

Consolidate the legacy and non-legacy V5 mailbox into v6 to be sure that the alias address is formatted correctly.

Current resolution looks into `packages/addressing/src/nameservices/NAMESERVICE_DESCRIPTIONS` for known NS names and domains to figure it out. Good enough for now and no need to look it up via the API.
