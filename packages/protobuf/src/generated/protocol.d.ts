import * as $protobuf from 'protobufjs';
/** Namespace protocol. */
export namespace protocol {
	/** Properties of a ECDHKeyBundle. */
	interface IECDHKeyBundle {
		/** ECDHKeyBundle publicEphemeralKey */
		publicEphemeralKey?: Uint8Array | null;

		/** ECDHKeyBundle publicIdentityKey */
		publicIdentityKey?: Uint8Array | null;
	}

	/** Represents a ECDHKeyBundle. */
	class ECDHKeyBundle implements IECDHKeyBundle {
		/** ECDHKeyBundle publicEphemeralKey. */
		public publicEphemeralKey: Uint8Array;
		/** ECDHKeyBundle publicIdentityKey. */
		public publicIdentityKey: Uint8Array;
		/**
		 * Constructs a new ECDHKeyBundle.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: protocol.IECDHKeyBundle);

		/**
		 * Creates a new ECDHKeyBundle instance using the specified properties.
		 * @param [properties] Properties to set
		 * @returns ECDHKeyBundle instance
		 */
		public static create(properties?: protocol.IECDHKeyBundle): protocol.ECDHKeyBundle;

		/**
		 * Encodes the specified ECDHKeyBundle message. Does not implicitly {@link protocol.ECDHKeyBundle.verify|verify} messages.
		 * @param message ECDHKeyBundle message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encode(message: protocol.IECDHKeyBundle, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified ECDHKeyBundle message, length delimited. Does not implicitly {@link protocol.ECDHKeyBundle.verify|verify} messages.
		 * @param message ECDHKeyBundle message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: protocol.IECDHKeyBundle, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes a ECDHKeyBundle message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns ECDHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): protocol.ECDHKeyBundle;

		/**
		 * Decodes a ECDHKeyBundle message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns ECDHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): protocol.ECDHKeyBundle;

		/**
		 * Verifies a ECDHKeyBundle message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

		/**
		 * Creates a ECDHKeyBundle message from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object
		 * @returns ECDHKeyBundle
		 */
		public static fromObject(object: { [k: string]: any }): protocol.ECDHKeyBundle;

		/**
		 * Creates a plain object from a ECDHKeyBundle message. Also converts values to other types if specified.
		 * @param message ECDHKeyBundle
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public static toObject(
			message: protocol.ECDHKeyBundle,
			options?: $protobuf.IConversionOptions,
		): { [k: string]: any };

		/**
		 * Converts this ECDHKeyBundle to JSON.
		 * @returns JSON object
		 */
		public toJSON(): { [k: string]: any };
	}

	/** Properties of a X3DHKeyBundle. */
	interface IX3DHKeyBundle {
		/** X3DHKeyBundle keyExchangeMethod */
		keyExchangeMethod?: protocol.KeyExchangeMethod | null;

		/** X3DHKeyBundle publicIdentityKey */
		publicIdentityKey?: Uint8Array | null;
	}

	/** Represents a X3DHKeyBundle. */
	class X3DHKeyBundle implements IX3DHKeyBundle {
		/** X3DHKeyBundle keyExchangeMethod. */
		public keyExchangeMethod: protocol.KeyExchangeMethod;
		/** X3DHKeyBundle publicIdentityKey. */
		public publicIdentityKey: Uint8Array;
		/**
		 * Constructs a new X3DHKeyBundle.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: protocol.IX3DHKeyBundle);

		/**
		 * Creates a new X3DHKeyBundle instance using the specified properties.
		 * @param [properties] Properties to set
		 * @returns X3DHKeyBundle instance
		 */
		public static create(properties?: protocol.IX3DHKeyBundle): protocol.X3DHKeyBundle;

		/**
		 * Encodes the specified X3DHKeyBundle message. Does not implicitly {@link protocol.X3DHKeyBundle.verify|verify} messages.
		 * @param message X3DHKeyBundle message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encode(message: protocol.IX3DHKeyBundle, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified X3DHKeyBundle message, length delimited. Does not implicitly {@link protocol.X3DHKeyBundle.verify|verify} messages.
		 * @param message X3DHKeyBundle message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: protocol.IX3DHKeyBundle, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes a X3DHKeyBundle message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns X3DHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): protocol.X3DHKeyBundle;

		/**
		 * Decodes a X3DHKeyBundle message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns X3DHKeyBundle
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): protocol.X3DHKeyBundle;

		/**
		 * Verifies a X3DHKeyBundle message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

		/**
		 * Creates a X3DHKeyBundle message from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object
		 * @returns X3DHKeyBundle
		 */
		public static fromObject(object: { [k: string]: any }): protocol.X3DHKeyBundle;

		/**
		 * Creates a plain object from a X3DHKeyBundle message. Also converts values to other types if specified.
		 * @param message X3DHKeyBundle
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public static toObject(
			message: protocol.X3DHKeyBundle,
			options?: $protobuf.IConversionOptions,
		): { [k: string]: any };

		/**
		 * Converts this X3DHKeyBundle to JSON.
		 * @returns JSON object
		 */
		public toJSON(): { [k: string]: any };
	}

	/** KeyExchangeMethod enum. */
	enum KeyExchangeMethod {
		Unknown = 0,
		ECDH = 1,
		X3DH = 2,
	}

	/** Properties of an Envelope. */
	interface IEnvelope {
		/**
		 * Message key is the encryption key to decrypt the message location and contents.
		 * Encrypted message key contains the message key which can be decrypted after a successful key exchange.
		 */
		encryptedMessageKey?: Uint8Array | null;

		/**
		 * Message URI is the location of the encrypted contents.
		 * Encrypted message URI contains the location which can be decrypted after a successful key exchange.
		 */
		encryptedMessageUri?: Uint8Array | null;

		/** Envelope keyExchangeMethod */
		keyExchangeMethod?: protocol.KeyExchangeMethod | null;

		/** Envelope ecdhKeyBundle */
		ecdhKeyBundle?: protocol.IECDHKeyBundle | null;
	}

	/**
	 * Envelope contains the information need for the recipient to retrieve and decrypt the message contents.
	 * When sending group messages one envelope is created per recipient.
	 */
	class Envelope implements IEnvelope {
		/**
		 * Message key is the encryption key to decrypt the message location and contents.
		 * Encrypted message key contains the message key which can be decrypted after a successful key exchange.
		 */
		public encryptedMessageKey: Uint8Array;
		/**
		 * Message URI is the location of the encrypted contents.
		 * Encrypted message URI contains the location which can be decrypted after a successful key exchange.
		 */
		public encryptedMessageUri: Uint8Array;
		/** Envelope keyExchangeMethod. */
		public keyExchangeMethod: protocol.KeyExchangeMethod;
		/** Envelope ecdhKeyBundle. */
		public ecdhKeyBundle?: protocol.IECDHKeyBundle | null;
		/**
		 * Constructs a new Envelope.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: protocol.IEnvelope);

		/**
		 * Creates a new Envelope instance using the specified properties.
		 * @param [properties] Properties to set
		 * @returns Envelope instance
		 */
		public static create(properties?: protocol.IEnvelope): protocol.Envelope;

		/**
		 * Encodes the specified Envelope message. Does not implicitly {@link protocol.Envelope.verify|verify} messages.
		 * @param message Envelope message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encode(message: protocol.IEnvelope, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified Envelope message, length delimited. Does not implicitly {@link protocol.Envelope.verify|verify} messages.
		 * @param message Envelope message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: protocol.IEnvelope, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes an Envelope message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns Envelope
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): protocol.Envelope;

		/**
		 * Decodes an Envelope message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns Envelope
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): protocol.Envelope;

		/**
		 * Verifies an Envelope message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

		/**
		 * Creates an Envelope message from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object
		 * @returns Envelope
		 */
		public static fromObject(object: { [k: string]: any }): protocol.Envelope;

		/**
		 * Creates a plain object from an Envelope message. Also converts values to other types if specified.
		 * @param message Envelope
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public static toObject(
			message: protocol.Envelope,
			options?: $protobuf.IConversionOptions,
		): { [k: string]: any };

		/**
		 * Converts this Envelope to JSON.
		 * @returns JSON object
		 */
		public toJSON(): { [k: string]: any };
	}

	/** Properties of a Delivery. */
	interface IDelivery {
		/** Delivery envelope */
		envelope?: protocol.IEnvelope | null;

		/**
		 * Public key associated with the delivery address. When sending a message to an address
		 * it must first be resolved to retrieve the public key.
		 *
		 * note multiple addresses may resolve
		 * to the same public key.
		 */
		destinationIdentity?: Uint8Array | null;
	}

	/** Information stored on the Mailchain protocol informing a delivery. */
	class Delivery implements IDelivery {
		/** Delivery envelope. */
		public envelope?: protocol.IEnvelope | null;
		/**
		 * Public key associated with the delivery address. When sending a message to an address
		 * it must first be resolved to retrieve the public key.
		 *
		 * note multiple addresses may resolve
		 * to the same public key.
		 */
		public destinationIdentity: Uint8Array;
		/**
		 * Constructs a new Delivery.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: protocol.IDelivery);

		/**
		 * Creates a new Delivery instance using the specified properties.
		 * @param [properties] Properties to set
		 * @returns Delivery instance
		 */
		public static create(properties?: protocol.IDelivery): protocol.Delivery;

		/**
		 * Encodes the specified Delivery message. Does not implicitly {@link protocol.Delivery.verify|verify} messages.
		 * @param message Delivery message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encode(message: protocol.IDelivery, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified Delivery message, length delimited. Does not implicitly {@link protocol.Delivery.verify|verify} messages.
		 * @param message Delivery message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: protocol.IDelivery, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes a Delivery message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns Delivery
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): protocol.Delivery;

		/**
		 * Decodes a Delivery message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns Delivery
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): protocol.Delivery;

		/**
		 * Verifies a Delivery message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

		/**
		 * Creates a Delivery message from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object
		 * @returns Delivery
		 */
		public static fromObject(object: { [k: string]: any }): protocol.Delivery;

		/**
		 * Creates a plain object from a Delivery message. Also converts values to other types if specified.
		 * @param message Delivery
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public static toObject(
			message: protocol.Delivery,
			options?: $protobuf.IConversionOptions,
		): { [k: string]: any };

		/**
		 * Converts this Delivery to JSON.
		 * @returns JSON object
		 */
		public toJSON(): { [k: string]: any };
	}
}
