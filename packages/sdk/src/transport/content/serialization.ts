import { EncryptedPayload } from './payload';

export enum MessageKind {
	UNSET = 0,
	HEADER = 1,
	CHUNK = 2,
	FINAL_CHUNK = 3,
}

enum Version {
	UNSET = 0,
	/**
	 * Uses 32 byte numbers for size of messages
	 */
	V1_0_0 = 1,
}

const SIZE_VERSION = 1;
const SIZE_MESSAGE_KIND = 1;
const SIZE_MESSAGE_BYTES_SIZE = 4;

export function serializeMessage(encryptedMessage: Buffer, messageKind: MessageKind): Buffer {
	if (messageKind === MessageKind.UNSET) {
		throw Error('message kind invalid');
	}
	const encryptedMessageSize = SIZE_MESSAGE_KIND + SIZE_MESSAGE_BYTES_SIZE + encryptedMessage.length;
	const metadata = Buffer.alloc(SIZE_MESSAGE_KIND + SIZE_MESSAGE_BYTES_SIZE);
	const endPositionKind = metadata.writeUInt8(messageKind, 0);
	metadata.writeUInt32BE(encryptedMessage.length, endPositionKind);

	return Buffer.concat([metadata, encryptedMessage], encryptedMessageSize);
}

export function Serialize(input: EncryptedPayload): Buffer {
	const bufferCollector = new Array<Buffer>(input.EncryptedContentChunks.length + 1 + 1);

	bufferCollector[0] = Buffer.from(new Uint8Array([Version.V1_0_0]));
	let totalBufferOutSize = SIZE_VERSION;

	const serializedHeader = serializeMessage(input.EncryptedHeaders, MessageKind.HEADER);
	bufferCollector[1] = serializedHeader;
	totalBufferOutSize += serializedHeader.length;

	input.EncryptedContentChunks.forEach((c, i) => {
		const kind = input.EncryptedContentChunks.length === i + 1 ? MessageKind.FINAL_CHUNK : MessageKind.CHUNK;
		const serializedChunk = serializeMessage(c, kind);
		bufferCollector[i + 2] = serializedChunk;
		totalBufferOutSize += serializedChunk.length;
	});

	return Buffer.concat(bufferCollector, totalBufferOutSize);
}

export function deserializeMessage(serializedMessage: Buffer): {
	kind: MessageKind;
	message: Buffer;
	remainingBuffer: Buffer;
} {
	if (serializedMessage.length < SIZE_MESSAGE_KIND + SIZE_MESSAGE_BYTES_SIZE) {
		throw new Error('message segment too short to open');
	}

	if (!(serializedMessage[0] in MessageKind)) {
		throw new Error('message kind invalid');
	}
	const kind = serializedMessage[0] as MessageKind;
	if (kind === MessageKind.UNSET) {
		throw new Error('message kind UNSET');
	}

	const messageSize = Number(serializedMessage.readUInt32BE(SIZE_MESSAGE_KIND));

	if (serializedMessage.length < messageSize + SIZE_MESSAGE_KIND + SIZE_MESSAGE_BYTES_SIZE) {
		throw new Error('message segment has missing data');
	}

	const offset = SIZE_MESSAGE_KIND + SIZE_MESSAGE_BYTES_SIZE;
	const end = offset + messageSize;
	const remainingBuffer = serializedMessage.slice(end);

	return {
		kind,
		message: serializedMessage.slice(offset, end),
		remainingBuffer,
	};
}

export function Deserialize(serializedData: Buffer): EncryptedPayload {
	const version = serializedData[0] as Version;
	if (version !== Version.V1_0_0) {
		throw new Error('serialization version not supported');
	}

	const headerPart = deserializeMessage(serializedData.slice(1));
	if (headerPart.kind !== MessageKind.HEADER) {
		throw new Error('expected header part');
	}

	let { remainingBuffer } = headerPart;
	let lastMessageKind = headerPart.kind as MessageKind;
	const deserializedChunks = new Array<Buffer>();

	while (remainingBuffer.length > 0) {
		const deserializedChunk = deserializeMessage(remainingBuffer);
		if (deserializedChunk.kind !== MessageKind.CHUNK && deserializedChunk.kind !== MessageKind.FINAL_CHUNK) {
			throw new Error('expected chunk variant');
		}
		deserializedChunks.push(deserializedChunk.message);

		remainingBuffer = deserializedChunk.remainingBuffer;
		lastMessageKind = deserializedChunk.kind;
	}

	// zero chunks is possible due to content location header
	if (deserializedChunks.length > 0 && lastMessageKind !== MessageKind.FINAL_CHUNK) {
		throw new Error('last chunk must be terminating chunk');
	}

	return {
		EncryptedContentChunks: deserializedChunks,
		EncryptedHeaders: headerPart.message,
	};
}
