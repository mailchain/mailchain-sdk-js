# Mailbox Operations versioning

`MailboxOperations` makes the connection for messages of the Web Application <-> Mailchain API and all the nuances in that connection (encryption, decryption, hashing).

The version is stored as plain number on Mailchain, and it is provided by the implementation of `MailboxOperations` (check the `MailboxOperations.saveMessage` method).

The reasoning behind version bump might be changes to the parameters in the API method that is saving the message, or changes to the underlying data of the message (the encrypted protobuf message).

## Glossary

-   `ProtoMessagePreview` - the protobuf representation of of the message `protoInbox.preview.MessagePreview`
-   `MessageRequestBody` - the parameters that are being provided to the `inboxApi.putEncryptedMessage`
-   `ApiMessagePreview` - the message object returned from the API

## Version history and changelog

### Version 1 (default) - initial

The initial implementation didn't have versioning information, so no `version` parameter is available for those messages. If there is message without `version` defined it is safe to assume that this massage is of version 1 message.

### Version 2 - `UserMailbox` added

-   `ProtoMessagePreview`
    -   ADDED `mailbox` field that has the raw bytes of `UserMailbox.identityKey.bytes`
-   `MessageRequestBody`
    -   ADDED `version` field with value `2`
    -   ADDED `mailbox` field that is hash of the raw bytes of the `UserMailbox.identityKey.bytes`

#### Migration strategy V1 -> V2

1. Acquire unencrypted version of the message `ProtoMessagePreview`
2. Acquire the IdentityKey of the mailbox

-   Try matching the `ProtoMessagePreview.owner` to some of the `UserProfile.mailboxes.aliases`. If there is match, use `userMailbox.identityKey`
-   Try using the Mailchain API to get the `IdentityKey` of the `ProtoMessagePreview.owner`

3. Encode and encrypt the message
4. Bump the version to `2`
5. Save the migrated message

### Version 3 - `hashedOwner` added

-   `ProtoMessagePreview`
    -   MODIFIED `mailbox` field to represent encoded public key (with `encodePublicKey`) instead of the raw public key bytes
-   `MessageRequestBody`
    -   BUMPED `version` to `3`
    -   ADDED `hashedOwner` that is hash values corresponding to the address hashing algorithm
    -   MODIFIED `mailbox` the hashing algorithm changed from `accountKey.sign(mailbox.identityKey)` to `sha256` hashed value of it, `sha256(accountKey.sign(mailbox.identityKey))`.
    -   MODIFIED `messageId` the hashing algorithm changed from `accountKey.sign(mailbox.identityKey.bytes)` to `sha256(accountKey(encodePublicKey(mailbox.identityKey)))`. Migration of `messageId` shall not be applied.
-   Other
    -   Around this time the payload message received `X-IdentityKeys` header that includes mapping of address->IdentityKey at the time of sending the message

#### Migration strategy V2 -> V3

1. Acquire unencrypted version of the message `ProtoMessagePreview`
2. Using the `ProtoMessagePreview.owner` create the `hashedOwner`
3. Re-create the mailbox identity key, by using the stored `protoMessagePreview.mailbox`
    - If it is `MAILCHAIN` protocol it will be of type ed25519, so `identityKey = new ED25519PublicKey(bytes)`
    - As of using v2, only `ETHEREUM` protocol was supported so the identity key will be sec256k1, so `identityKey = new SEC256K1PublicKey(bytes)`
4. Write the restored identity key into `protoMessagePreview.mailbox`.
5. Re-hash the `messageRequestBody.mailbox` with the new algorithm.
6. Bump the version to `3`
7. Save the migrated message
