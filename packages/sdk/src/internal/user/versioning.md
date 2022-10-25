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
