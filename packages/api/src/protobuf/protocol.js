/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
'use strict';

var $protobuf = require('protobufjs/minimal');

// Common aliases
var $Reader = $protobuf.Reader,
	$Writer = $protobuf.Writer,
	$util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {});

$root.protocol = (function () {
	/**
	 * Namespace protocol.
	 * @exports protocol
	 * @namespace
	 */
	var protocol = {};

	protocol.ECDHKeyBundle = (function () {
		/**
		 * Properties of a ECDHKeyBundle.
		 * @memberof protocol
		 * @interface IECDHKeyBundle
		 * @property {Uint8Array|null} [publicEphemeralKey] ECDHKeyBundle publicEphemeralKey
		 * @property {Uint8Array|null} [publicMessagingKey] ECDHKeyBundle publicMessagingKey
		 */

		/**
		 * Constructs a new ECDHKeyBundle.
		 * @memberof protocol
		 * @classdesc Represents a ECDHKeyBundle.
		 * @implements IECDHKeyBundle
		 * @constructor
		 * @param {protocol.IECDHKeyBundle=} [properties] Properties to set
		 */
		function ECDHKeyBundle(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		/**
		 * ECDHKeyBundle publicEphemeralKey.
		 * @member {Uint8Array} publicEphemeralKey
		 * @memberof protocol.ECDHKeyBundle
		 * @instance
		 */
		ECDHKeyBundle.prototype.publicEphemeralKey = $util.newBuffer([]);

		/**
		 * ECDHKeyBundle publicMessagingKey.
		 * @member {Uint8Array} publicMessagingKey
		 * @memberof protocol.ECDHKeyBundle
		 * @instance
		 */
		ECDHKeyBundle.prototype.publicMessagingKey = $util.newBuffer([]);

		/**
		 * Creates a new ECDHKeyBundle instance using the specified properties.
		 * @function create
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {protocol.IECDHKeyBundle=} [properties] Properties to set
		 * @returns {protocol.ECDHKeyBundle} ECDHKeyBundle instance
		 */
		ECDHKeyBundle.create = function create(properties) {
			return new ECDHKeyBundle(properties);
		};

		/**
		 * Encodes the specified ECDHKeyBundle message. Does not implicitly {@link protocol.ECDHKeyBundle.verify|verify} messages.
		 * @function encode
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {protocol.IECDHKeyBundle} message ECDHKeyBundle message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		ECDHKeyBundle.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.publicEphemeralKey != null && Object.hasOwnProperty.call(message, 'publicEphemeralKey'))
				writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.publicEphemeralKey);
			if (message.publicMessagingKey != null && Object.hasOwnProperty.call(message, 'publicMessagingKey'))
				writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.publicMessagingKey);
			return writer;
		};

		/**
		 * Encodes the specified ECDHKeyBundle message, length delimited. Does not implicitly {@link protocol.ECDHKeyBundle.verify|verify} messages.
		 * @function encodeDelimited
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {protocol.IECDHKeyBundle} message ECDHKeyBundle message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		ECDHKeyBundle.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		/**
		 * Decodes a ECDHKeyBundle message from the specified reader or buffer.
		 * @function decode
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @param {number} [length] Message length if known beforehand
		 * @returns {protocol.ECDHKeyBundle} ECDHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		ECDHKeyBundle.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.protocol.ECDHKeyBundle();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.publicEphemeralKey = reader.bytes();
						break;
					case 2:
						message.publicMessagingKey = reader.bytes();
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		/**
		 * Decodes a ECDHKeyBundle message from the specified reader or buffer, length delimited.
		 * @function decodeDelimited
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @returns {protocol.ECDHKeyBundle} ECDHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		ECDHKeyBundle.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		/**
		 * Verifies a ECDHKeyBundle message.
		 * @function verify
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {Object.<string,*>} message Plain object to verify
		 * @returns {string|null} `null` if valid, otherwise the reason why it is not
		 */
		ECDHKeyBundle.verify = function verify(message) {
			if (typeof message !== 'object' || message === null) return 'object expected';
			if (message.publicEphemeralKey != null && message.hasOwnProperty('publicEphemeralKey'))
				if (
					!(
						(message.publicEphemeralKey && typeof message.publicEphemeralKey.length === 'number') ||
						$util.isString(message.publicEphemeralKey)
					)
				)
					return 'publicEphemeralKey: buffer expected';
			if (message.publicMessagingKey != null && message.hasOwnProperty('publicMessagingKey'))
				if (
					!(
						(message.publicMessagingKey && typeof message.publicMessagingKey.length === 'number') ||
						$util.isString(message.publicMessagingKey)
					)
				)
					return 'publicMessagingKey: buffer expected';
			return null;
		};

		/**
		 * Creates a ECDHKeyBundle message from a plain object. Also converts values to their respective internal types.
		 * @function fromObject
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {Object.<string,*>} object Plain object
		 * @returns {protocol.ECDHKeyBundle} ECDHKeyBundle
		 */
		ECDHKeyBundle.fromObject = function fromObject(object) {
			if (object instanceof $root.protocol.ECDHKeyBundle) return object;
			var message = new $root.protocol.ECDHKeyBundle();
			if (object.publicEphemeralKey != null)
				if (typeof object.publicEphemeralKey === 'string')
					$util.base64.decode(
						object.publicEphemeralKey,
						(message.publicEphemeralKey = $util.newBuffer($util.base64.length(object.publicEphemeralKey))),
						0,
					);
				else if (object.publicEphemeralKey.length) message.publicEphemeralKey = object.publicEphemeralKey;
			if (object.publicMessagingKey != null)
				if (typeof object.publicMessagingKey === 'string')
					$util.base64.decode(
						object.publicMessagingKey,
						(message.publicMessagingKey = $util.newBuffer($util.base64.length(object.publicMessagingKey))),
						0,
					);
				else if (object.publicMessagingKey.length) message.publicMessagingKey = object.publicMessagingKey;
			return message;
		};

		/**
		 * Creates a plain object from a ECDHKeyBundle message. Also converts values to other types if specified.
		 * @function toObject
		 * @memberof protocol.ECDHKeyBundle
		 * @static
		 * @param {protocol.ECDHKeyBundle} message ECDHKeyBundle
		 * @param {$protobuf.IConversionOptions} [options] Conversion options
		 * @returns {Object.<string,*>} Plain object
		 */
		ECDHKeyBundle.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				if (options.bytes === String) object.publicEphemeralKey = '';
				else {
					object.publicEphemeralKey = [];
					if (options.bytes !== Array) object.publicEphemeralKey = $util.newBuffer(object.publicEphemeralKey);
				}
				if (options.bytes === String) object.publicMessagingKey = '';
				else {
					object.publicMessagingKey = [];
					if (options.bytes !== Array) object.publicMessagingKey = $util.newBuffer(object.publicMessagingKey);
				}
			}
			if (message.publicEphemeralKey != null && message.hasOwnProperty('publicEphemeralKey'))
				object.publicEphemeralKey =
					options.bytes === String
						? $util.base64.encode(message.publicEphemeralKey, 0, message.publicEphemeralKey.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.publicEphemeralKey)
						: message.publicEphemeralKey;
			if (message.publicMessagingKey != null && message.hasOwnProperty('publicMessagingKey'))
				object.publicMessagingKey =
					options.bytes === String
						? $util.base64.encode(message.publicMessagingKey, 0, message.publicMessagingKey.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.publicMessagingKey)
						: message.publicMessagingKey;
			return object;
		};

		/**
		 * Converts this ECDHKeyBundle to JSON.
		 * @function toJSON
		 * @memberof protocol.ECDHKeyBundle
		 * @instance
		 * @returns {Object.<string,*>} JSON object
		 */
		ECDHKeyBundle.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return ECDHKeyBundle;
	})();

	protocol.X3DHKeyBundle = (function () {
		/**
		 * Properties of a X3DHKeyBundle.
		 * @memberof protocol
		 * @interface IX3DHKeyBundle
		 * @property {protocol.KeyExchangeMethod|null} [keyExchangeMethod] X3DHKeyBundle keyExchangeMethod
		 * @property {Uint8Array|null} [publicMessagingKey] X3DHKeyBundle publicMessagingKey
		 */

		/**
		 * Constructs a new X3DHKeyBundle.
		 * @memberof protocol
		 * @classdesc Represents a X3DHKeyBundle.
		 * @implements IX3DHKeyBundle
		 * @constructor
		 * @param {protocol.IX3DHKeyBundle=} [properties] Properties to set
		 */
		function X3DHKeyBundle(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		/**
		 * X3DHKeyBundle keyExchangeMethod.
		 * @member {protocol.KeyExchangeMethod} keyExchangeMethod
		 * @memberof protocol.X3DHKeyBundle
		 * @instance
		 */
		X3DHKeyBundle.prototype.keyExchangeMethod = 0;

		/**
		 * X3DHKeyBundle publicMessagingKey.
		 * @member {Uint8Array} publicMessagingKey
		 * @memberof protocol.X3DHKeyBundle
		 * @instance
		 */
		X3DHKeyBundle.prototype.publicMessagingKey = $util.newBuffer([]);

		/**
		 * Creates a new X3DHKeyBundle instance using the specified properties.
		 * @function create
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {protocol.IX3DHKeyBundle=} [properties] Properties to set
		 * @returns {protocol.X3DHKeyBundle} X3DHKeyBundle instance
		 */
		X3DHKeyBundle.create = function create(properties) {
			return new X3DHKeyBundle(properties);
		};

		/**
		 * Encodes the specified X3DHKeyBundle message. Does not implicitly {@link protocol.X3DHKeyBundle.verify|verify} messages.
		 * @function encode
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {protocol.IX3DHKeyBundle} message X3DHKeyBundle message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		X3DHKeyBundle.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.keyExchangeMethod != null && Object.hasOwnProperty.call(message, 'keyExchangeMethod'))
				writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.keyExchangeMethod);
			if (message.publicMessagingKey != null && Object.hasOwnProperty.call(message, 'publicMessagingKey'))
				writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.publicMessagingKey);
			return writer;
		};

		/**
		 * Encodes the specified X3DHKeyBundle message, length delimited. Does not implicitly {@link protocol.X3DHKeyBundle.verify|verify} messages.
		 * @function encodeDelimited
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {protocol.IX3DHKeyBundle} message X3DHKeyBundle message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		X3DHKeyBundle.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		/**
		 * Decodes a X3DHKeyBundle message from the specified reader or buffer.
		 * @function decode
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @param {number} [length] Message length if known beforehand
		 * @returns {protocol.X3DHKeyBundle} X3DHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		X3DHKeyBundle.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.protocol.X3DHKeyBundle();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.keyExchangeMethod = reader.int32();
						break;
					case 2:
						message.publicMessagingKey = reader.bytes();
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		/**
		 * Decodes a X3DHKeyBundle message from the specified reader or buffer, length delimited.
		 * @function decodeDelimited
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @returns {protocol.X3DHKeyBundle} X3DHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		X3DHKeyBundle.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		/**
		 * Verifies a X3DHKeyBundle message.
		 * @function verify
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {Object.<string,*>} message Plain object to verify
		 * @returns {string|null} `null` if valid, otherwise the reason why it is not
		 */
		X3DHKeyBundle.verify = function verify(message) {
			if (typeof message !== 'object' || message === null) return 'object expected';
			if (message.keyExchangeMethod != null && message.hasOwnProperty('keyExchangeMethod'))
				switch (message.keyExchangeMethod) {
					default:
						return 'keyExchangeMethod: enum value expected';
					case 0:
					case 1:
					case 2:
						break;
				}
			if (message.publicMessagingKey != null && message.hasOwnProperty('publicMessagingKey'))
				if (
					!(
						(message.publicMessagingKey && typeof message.publicMessagingKey.length === 'number') ||
						$util.isString(message.publicMessagingKey)
					)
				)
					return 'publicMessagingKey: buffer expected';
			return null;
		};

		/**
		 * Creates a X3DHKeyBundle message from a plain object. Also converts values to their respective internal types.
		 * @function fromObject
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {Object.<string,*>} object Plain object
		 * @returns {protocol.X3DHKeyBundle} X3DHKeyBundle
		 */
		X3DHKeyBundle.fromObject = function fromObject(object) {
			if (object instanceof $root.protocol.X3DHKeyBundle) return object;
			var message = new $root.protocol.X3DHKeyBundle();
			switch (object.keyExchangeMethod) {
				case 'Unknown':
				case 0:
					message.keyExchangeMethod = 0;
					break;
				case 'ECDH':
				case 1:
					message.keyExchangeMethod = 1;
					break;
				case 'X3DH':
				case 2:
					message.keyExchangeMethod = 2;
					break;
			}
			if (object.publicMessagingKey != null)
				if (typeof object.publicMessagingKey === 'string')
					$util.base64.decode(
						object.publicMessagingKey,
						(message.publicMessagingKey = $util.newBuffer($util.base64.length(object.publicMessagingKey))),
						0,
					);
				else if (object.publicMessagingKey.length) message.publicMessagingKey = object.publicMessagingKey;
			return message;
		};

		/**
		 * Creates a plain object from a X3DHKeyBundle message. Also converts values to other types if specified.
		 * @function toObject
		 * @memberof protocol.X3DHKeyBundle
		 * @static
		 * @param {protocol.X3DHKeyBundle} message X3DHKeyBundle
		 * @param {$protobuf.IConversionOptions} [options] Conversion options
		 * @returns {Object.<string,*>} Plain object
		 */
		X3DHKeyBundle.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				object.keyExchangeMethod = options.enums === String ? 'Unknown' : 0;
				if (options.bytes === String) object.publicMessagingKey = '';
				else {
					object.publicMessagingKey = [];
					if (options.bytes !== Array) object.publicMessagingKey = $util.newBuffer(object.publicMessagingKey);
				}
			}
			if (message.keyExchangeMethod != null && message.hasOwnProperty('keyExchangeMethod'))
				object.keyExchangeMethod =
					options.enums === String
						? $root.protocol.KeyExchangeMethod[message.keyExchangeMethod]
						: message.keyExchangeMethod;
			if (message.publicMessagingKey != null && message.hasOwnProperty('publicMessagingKey'))
				object.publicMessagingKey =
					options.bytes === String
						? $util.base64.encode(message.publicMessagingKey, 0, message.publicMessagingKey.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.publicMessagingKey)
						: message.publicMessagingKey;
			return object;
		};

		/**
		 * Converts this X3DHKeyBundle to JSON.
		 * @function toJSON
		 * @memberof protocol.X3DHKeyBundle
		 * @instance
		 * @returns {Object.<string,*>} JSON object
		 */
		X3DHKeyBundle.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return X3DHKeyBundle;
	})();

	/**
	 * KeyExchangeMethod enum.
	 * @name protocol.KeyExchangeMethod
	 * @enum {number}
	 * @property {number} Unknown=0 Unknown value
	 * @property {number} ECDH=1 ECDH value
	 * @property {number} X3DH=2 X3DH value
	 */
	protocol.KeyExchangeMethod = (function () {
		var valuesById = {},
			values = Object.create(valuesById);
		values[(valuesById[0] = 'Unknown')] = 0;
		values[(valuesById[1] = 'ECDH')] = 1;
		values[(valuesById[2] = 'X3DH')] = 2;
		return values;
	})();

	protocol.Envelope = (function () {
		/**
		 * Properties of an Envelope.
		 * @memberof protocol
		 * @interface IEnvelope
		 * @property {Uint8Array|null} [encryptedMessageKey] Message key is the encryption key to decrypt the message location and contents.
		 * Encrypted message key contains the message key which can be decrypted after a successful key exchange.
		 * @property {Uint8Array|null} [encryptedMessageUri] Message URI is the location of the encrypted contents.
		 * Encrypted message URI contains the location which can be decrypted after a successful key exchange.
		 * @property {protocol.KeyExchangeMethod|null} [keyExchangeMethod] Envelope keyExchangeMethod
		 * @property {protocol.IECDHKeyBundle|null} [ecdhKeyBundle] Envelope ecdhKeyBundle
		 */

		/**
		 * Constructs a new Envelope.
		 * @memberof protocol
		 * @classdesc Envelope contains the information need for the recipient to retrieve and decrypt the message contents.
		 * When sending group messages one envelope is created per recipient.
		 * @implements IEnvelope
		 * @constructor
		 * @param {protocol.IEnvelope=} [properties] Properties to set
		 */
		function Envelope(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		/**
		 * Message key is the encryption key to decrypt the message location and contents.
		 * Encrypted message key contains the message key which can be decrypted after a successful key exchange.
		 * @member {Uint8Array} encryptedMessageKey
		 * @memberof protocol.Envelope
		 * @instance
		 */
		Envelope.prototype.encryptedMessageKey = $util.newBuffer([]);

		/**
		 * Message URI is the location of the encrypted contents.
		 * Encrypted message URI contains the location which can be decrypted after a successful key exchange.
		 * @member {Uint8Array} encryptedMessageUri
		 * @memberof protocol.Envelope
		 * @instance
		 */
		Envelope.prototype.encryptedMessageUri = $util.newBuffer([]);

		/**
		 * Envelope keyExchangeMethod.
		 * @member {protocol.KeyExchangeMethod} keyExchangeMethod
		 * @memberof protocol.Envelope
		 * @instance
		 */
		Envelope.prototype.keyExchangeMethod = 0;

		/**
		 * Envelope ecdhKeyBundle.
		 * @member {protocol.IECDHKeyBundle|null|undefined} ecdhKeyBundle
		 * @memberof protocol.Envelope
		 * @instance
		 */
		Envelope.prototype.ecdhKeyBundle = null;

		/**
		 * Creates a new Envelope instance using the specified properties.
		 * @function create
		 * @memberof protocol.Envelope
		 * @static
		 * @param {protocol.IEnvelope=} [properties] Properties to set
		 * @returns {protocol.Envelope} Envelope instance
		 */
		Envelope.create = function create(properties) {
			return new Envelope(properties);
		};

		/**
		 * Encodes the specified Envelope message. Does not implicitly {@link protocol.Envelope.verify|verify} messages.
		 * @function encode
		 * @memberof protocol.Envelope
		 * @static
		 * @param {protocol.IEnvelope} message Envelope message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		Envelope.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.encryptedMessageKey != null && Object.hasOwnProperty.call(message, 'encryptedMessageKey'))
				writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.encryptedMessageKey);
			if (message.encryptedMessageUri != null && Object.hasOwnProperty.call(message, 'encryptedMessageUri'))
				writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.encryptedMessageUri);
			if (message.keyExchangeMethod != null && Object.hasOwnProperty.call(message, 'keyExchangeMethod'))
				writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.keyExchangeMethod);
			if (message.ecdhKeyBundle != null && Object.hasOwnProperty.call(message, 'ecdhKeyBundle'))
				$root.protocol.ECDHKeyBundle.encode(
					message.ecdhKeyBundle,
					writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
				).ldelim();
			return writer;
		};

		/**
		 * Encodes the specified Envelope message, length delimited. Does not implicitly {@link protocol.Envelope.verify|verify} messages.
		 * @function encodeDelimited
		 * @memberof protocol.Envelope
		 * @static
		 * @param {protocol.IEnvelope} message Envelope message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		Envelope.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		/**
		 * Decodes an Envelope message from the specified reader or buffer.
		 * @function decode
		 * @memberof protocol.Envelope
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @param {number} [length] Message length if known beforehand
		 * @returns {protocol.Envelope} Envelope
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		Envelope.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.protocol.Envelope();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.encryptedMessageKey = reader.bytes();
						break;
					case 2:
						message.encryptedMessageUri = reader.bytes();
						break;
					case 3:
						message.keyExchangeMethod = reader.int32();
						break;
					case 4:
						message.ecdhKeyBundle = $root.protocol.ECDHKeyBundle.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		/**
		 * Decodes an Envelope message from the specified reader or buffer, length delimited.
		 * @function decodeDelimited
		 * @memberof protocol.Envelope
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @returns {protocol.Envelope} Envelope
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		Envelope.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		/**
		 * Verifies an Envelope message.
		 * @function verify
		 * @memberof protocol.Envelope
		 * @static
		 * @param {Object.<string,*>} message Plain object to verify
		 * @returns {string|null} `null` if valid, otherwise the reason why it is not
		 */
		Envelope.verify = function verify(message) {
			if (typeof message !== 'object' || message === null) return 'object expected';
			if (message.encryptedMessageKey != null && message.hasOwnProperty('encryptedMessageKey'))
				if (
					!(
						(message.encryptedMessageKey && typeof message.encryptedMessageKey.length === 'number') ||
						$util.isString(message.encryptedMessageKey)
					)
				)
					return 'encryptedMessageKey: buffer expected';
			if (message.encryptedMessageUri != null && message.hasOwnProperty('encryptedMessageUri'))
				if (
					!(
						(message.encryptedMessageUri && typeof message.encryptedMessageUri.length === 'number') ||
						$util.isString(message.encryptedMessageUri)
					)
				)
					return 'encryptedMessageUri: buffer expected';
			if (message.keyExchangeMethod != null && message.hasOwnProperty('keyExchangeMethod'))
				switch (message.keyExchangeMethod) {
					default:
						return 'keyExchangeMethod: enum value expected';
					case 0:
					case 1:
					case 2:
						break;
				}
			if (message.ecdhKeyBundle != null && message.hasOwnProperty('ecdhKeyBundle')) {
				var error = $root.protocol.ECDHKeyBundle.verify(message.ecdhKeyBundle);
				if (error) return 'ecdhKeyBundle.' + error;
			}
			return null;
		};

		/**
		 * Creates an Envelope message from a plain object. Also converts values to their respective internal types.
		 * @function fromObject
		 * @memberof protocol.Envelope
		 * @static
		 * @param {Object.<string,*>} object Plain object
		 * @returns {protocol.Envelope} Envelope
		 */
		Envelope.fromObject = function fromObject(object) {
			if (object instanceof $root.protocol.Envelope) return object;
			var message = new $root.protocol.Envelope();
			if (object.encryptedMessageKey != null)
				if (typeof object.encryptedMessageKey === 'string')
					$util.base64.decode(
						object.encryptedMessageKey,
						(message.encryptedMessageKey = $util.newBuffer(
							$util.base64.length(object.encryptedMessageKey),
						)),
						0,
					);
				else if (object.encryptedMessageKey.length) message.encryptedMessageKey = object.encryptedMessageKey;
			if (object.encryptedMessageUri != null)
				if (typeof object.encryptedMessageUri === 'string')
					$util.base64.decode(
						object.encryptedMessageUri,
						(message.encryptedMessageUri = $util.newBuffer(
							$util.base64.length(object.encryptedMessageUri),
						)),
						0,
					);
				else if (object.encryptedMessageUri.length) message.encryptedMessageUri = object.encryptedMessageUri;
			switch (object.keyExchangeMethod) {
				case 'Unknown':
				case 0:
					message.keyExchangeMethod = 0;
					break;
				case 'ECDH':
				case 1:
					message.keyExchangeMethod = 1;
					break;
				case 'X3DH':
				case 2:
					message.keyExchangeMethod = 2;
					break;
			}
			if (object.ecdhKeyBundle != null) {
				if (typeof object.ecdhKeyBundle !== 'object')
					throw TypeError('.protocol.Envelope.ecdhKeyBundle: object expected');
				message.ecdhKeyBundle = $root.protocol.ECDHKeyBundle.fromObject(object.ecdhKeyBundle);
			}
			return message;
		};

		/**
		 * Creates a plain object from an Envelope message. Also converts values to other types if specified.
		 * @function toObject
		 * @memberof protocol.Envelope
		 * @static
		 * @param {protocol.Envelope} message Envelope
		 * @param {$protobuf.IConversionOptions} [options] Conversion options
		 * @returns {Object.<string,*>} Plain object
		 */
		Envelope.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				if (options.bytes === String) object.encryptedMessageKey = '';
				else {
					object.encryptedMessageKey = [];
					if (options.bytes !== Array)
						object.encryptedMessageKey = $util.newBuffer(object.encryptedMessageKey);
				}
				if (options.bytes === String) object.encryptedMessageUri = '';
				else {
					object.encryptedMessageUri = [];
					if (options.bytes !== Array)
						object.encryptedMessageUri = $util.newBuffer(object.encryptedMessageUri);
				}
				object.keyExchangeMethod = options.enums === String ? 'Unknown' : 0;
				object.ecdhKeyBundle = null;
			}
			if (message.encryptedMessageKey != null && message.hasOwnProperty('encryptedMessageKey'))
				object.encryptedMessageKey =
					options.bytes === String
						? $util.base64.encode(message.encryptedMessageKey, 0, message.encryptedMessageKey.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.encryptedMessageKey)
						: message.encryptedMessageKey;
			if (message.encryptedMessageUri != null && message.hasOwnProperty('encryptedMessageUri'))
				object.encryptedMessageUri =
					options.bytes === String
						? $util.base64.encode(message.encryptedMessageUri, 0, message.encryptedMessageUri.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.encryptedMessageUri)
						: message.encryptedMessageUri;
			if (message.keyExchangeMethod != null && message.hasOwnProperty('keyExchangeMethod'))
				object.keyExchangeMethod =
					options.enums === String
						? $root.protocol.KeyExchangeMethod[message.keyExchangeMethod]
						: message.keyExchangeMethod;
			if (message.ecdhKeyBundle != null && message.hasOwnProperty('ecdhKeyBundle'))
				object.ecdhKeyBundle = $root.protocol.ECDHKeyBundle.toObject(message.ecdhKeyBundle, options);
			return object;
		};

		/**
		 * Converts this Envelope to JSON.
		 * @function toJSON
		 * @memberof protocol.Envelope
		 * @instance
		 * @returns {Object.<string,*>} JSON object
		 */
		Envelope.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return Envelope;
	})();

	protocol.Delivery = (function () {
		/**
		 * Properties of a Delivery.
		 * @memberof protocol
		 * @interface IDelivery
		 * @property {protocol.IEnvelope|null} [envelope] Delivery envelope
		 */

		/**
		 * Constructs a new Delivery.
		 * @memberof protocol
		 * @classdesc Information stored on the Mailchain protocol informing a delivery.
		 * @implements IDelivery
		 * @constructor
		 * @param {protocol.IDelivery=} [properties] Properties to set
		 */
		function Delivery(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		/**
		 * Delivery envelope.
		 * @member {protocol.IEnvelope|null|undefined} envelope
		 * @memberof protocol.Delivery
		 * @instance
		 */
		Delivery.prototype.envelope = null;

		/**
		 * Creates a new Delivery instance using the specified properties.
		 * @function create
		 * @memberof protocol.Delivery
		 * @static
		 * @param {protocol.IDelivery=} [properties] Properties to set
		 * @returns {protocol.Delivery} Delivery instance
		 */
		Delivery.create = function create(properties) {
			return new Delivery(properties);
		};

		/**
		 * Encodes the specified Delivery message. Does not implicitly {@link protocol.Delivery.verify|verify} messages.
		 * @function encode
		 * @memberof protocol.Delivery
		 * @static
		 * @param {protocol.IDelivery} message Delivery message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		Delivery.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.envelope != null && Object.hasOwnProperty.call(message, 'envelope'))
				$root.protocol.Envelope.encode(
					message.envelope,
					writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
				).ldelim();
			return writer;
		};

		/**
		 * Encodes the specified Delivery message, length delimited. Does not implicitly {@link protocol.Delivery.verify|verify} messages.
		 * @function encodeDelimited
		 * @memberof protocol.Delivery
		 * @static
		 * @param {protocol.IDelivery} message Delivery message or plain object to encode
		 * @param {$protobuf.Writer} [writer] Writer to encode to
		 * @returns {$protobuf.Writer} Writer
		 */
		Delivery.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		/**
		 * Decodes a Delivery message from the specified reader or buffer.
		 * @function decode
		 * @memberof protocol.Delivery
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @param {number} [length] Message length if known beforehand
		 * @returns {protocol.Delivery} Delivery
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		Delivery.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.protocol.Delivery();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.envelope = $root.protocol.Envelope.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		/**
		 * Decodes a Delivery message from the specified reader or buffer, length delimited.
		 * @function decodeDelimited
		 * @memberof protocol.Delivery
		 * @static
		 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
		 * @returns {protocol.Delivery} Delivery
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		Delivery.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		/**
		 * Verifies a Delivery message.
		 * @function verify
		 * @memberof protocol.Delivery
		 * @static
		 * @param {Object.<string,*>} message Plain object to verify
		 * @returns {string|null} `null` if valid, otherwise the reason why it is not
		 */
		Delivery.verify = function verify(message) {
			if (typeof message !== 'object' || message === null) return 'object expected';
			if (message.envelope != null && message.hasOwnProperty('envelope')) {
				var error = $root.protocol.Envelope.verify(message.envelope);
				if (error) return 'envelope.' + error;
			}
			return null;
		};

		/**
		 * Creates a Delivery message from a plain object. Also converts values to their respective internal types.
		 * @function fromObject
		 * @memberof protocol.Delivery
		 * @static
		 * @param {Object.<string,*>} object Plain object
		 * @returns {protocol.Delivery} Delivery
		 */
		Delivery.fromObject = function fromObject(object) {
			if (object instanceof $root.protocol.Delivery) return object;
			var message = new $root.protocol.Delivery();
			if (object.envelope != null) {
				if (typeof object.envelope !== 'object')
					throw TypeError('.protocol.Delivery.envelope: object expected');
				message.envelope = $root.protocol.Envelope.fromObject(object.envelope);
			}
			return message;
		};

		/**
		 * Creates a plain object from a Delivery message. Also converts values to other types if specified.
		 * @function toObject
		 * @memberof protocol.Delivery
		 * @static
		 * @param {protocol.Delivery} message Delivery
		 * @param {$protobuf.IConversionOptions} [options] Conversion options
		 * @returns {Object.<string,*>} Plain object
		 */
		Delivery.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) object.envelope = null;
			if (message.envelope != null && message.hasOwnProperty('envelope'))
				object.envelope = $root.protocol.Envelope.toObject(message.envelope, options);
			return object;
		};

		/**
		 * Converts this Delivery to JSON.
		 * @function toJSON
		 * @memberof protocol.Delivery
		 * @instance
		 * @returns {Object.<string,*>} JSON object
		 */
		Delivery.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return Delivery;
	})();

	return protocol;
})();

module.exports = $root;
