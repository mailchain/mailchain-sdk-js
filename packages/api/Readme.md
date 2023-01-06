# Mailchain API

Mailchain is a messaging protocol that lets users communicate across protocols. Using Mailchain you can send messages to any blockchain address on different protocols.

For full usage examples view the [developer docs](https://docs.mailchain.com).

## Installing

Using npm:

```bash
$ npm install @mailchain/api
```

Using yarn:

```bash
$ yarn add @mailchain/api
```

## Purpose

The signatures package is used by `@mailchain/sdk` to communicate to Mailchain's protocol and services.

**Note: The API package is not intended to be used directly. Instead it should be used via the SDK as the majority of Mailchain's API's are authenticated. Requests need to be encrypted and signed before sending to across the wire. Response need to be decrypted and or verified before being used.**
