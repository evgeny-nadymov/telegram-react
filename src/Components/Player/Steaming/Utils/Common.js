export function LOG(message, ...optionalParams) {
    return;
    console.log(message, ...optionalParams);
}

export function ERROR(message, ...optionalParams) {
    console.error(message, ...optionalParams);
}

export function logSourceBufferRanges (sourceBuffer, currentTime, duration) {
    const ranges = [];
    for (let i = 0; i < sourceBuffer.buffered.length; i++) {
        ranges.push({ start: sourceBuffer.buffered.start(i), end: sourceBuffer.buffered.end(i)})
    }

    LOG('[SourceBuffer] ranges', sourceBuffer.id, currentTime, duration, sourceBuffer.pendingUpdates.length, JSON.stringify(ranges));
}

export const strtokBITSET = {
    get: (buf, off, bit) => {
        return (buf[off] & (1 << bit)) !== 0;
    },
    len: 1
};

function readUTF16String(buffer) {
    let offset = 2;
    let label = 'utf-16';
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) { // big endian
        offset = 2;
        label = 'utf-16be';
    } else if (buffer[0] === 0xFF && buffer[1] === 0xFE) { // little endian
        offset = 2;
        label = 'utf-16le';
    }

    return new TextDecoder(label).decode(buffer.slice(offset));
}

function readUTF8String(buffer) {
    return new TextDecoder('utf-8').decode(buffer);
}

function readWindows1292String(buffer) {
    return new TextDecoder('iso-8859-1').decode(buffer);
}

/**
 *
 * @param buffer Decoder input data
 * @param encoding 'utf16le' | 'utf16' | 'utf8' | 'iso-8859-1'
 * @return {string}
 */
export function decodeString(buffer, encoding) {
    // annoying workaround for a double BOM issue
    // https://github.com/leetreveil/musicmetadata/issues/84
    if (buffer[0] === 0xFF && buffer[1] === 0xFE && buffer[2] === 0xFE && buffer[3] === 0xFF) {
        buffer = buffer.slice(2);
    }

    if (encoding === 'utf16le' || encoding === 'utf16') {
        return readUTF16String(buffer);
    } else if (encoding === 'utf8') {
        return readUTF8String(buffer);
    } else if (encoding === 'iso-8859-1') {
        return readWindows1292String(buffer);
    }

    throw Error(encoding + ' encoding is not supported!');
}

export function trimRightNull(x) {
    const pos0 = x.indexOf('\0');
    return pos0 === -1 ? x : x.substr(0, pos0);
}

/**
 * Read bit-aligned number start from buffer
 * Total offset in bits = byteOffset * 8 + bitOffset
 * @param buf Byte buffer
 * @param byteOffset Starting offset in bytes
 * @param bitOffset Starting offset in bits: 0 = lsb
 * @param len Length of number in bits
 * @return {number} decoded bit aligned number
 */
export function getBitAllignedNumber(buf, byteOffset, bitOffset, len){
    const byteOff = byteOffset + ~~(bitOffset / 8);
    const bitOff = bitOffset % 8;
    let value = buf[byteOff];
    value &= 0xff >> bitOff;
    const bitsRead = 8 - bitOff;
    const bitsLeft = len - bitsRead;
    if (bitsLeft < 0) {
        value >>= (8 - bitOff - len);
    } else if (bitsLeft > 0) {
        value <<= bitsLeft;
        value |= getBitAllignedNumber(buf, byteOffset, bitOffset + bitsRead, bitsLeft);
    }
    return value;
}

/**
 * Read bit-aligned number start from buffer
 * Total offset in bits = byteOffset * 8 + bitOffset
 * @param buf Byte buffer
 * @param byteOffset Starting offset in bytes
 * @param bitOffset Starting offset in bits: 0 = most significant bit, 7 is least significant bit
 * @return {boolean} decoded bit aligned number
 */
export function isBitSet(buf, byteOffset, bitOffset) {
    return getBitAllignedNumber(buf, byteOffset, bitOffset, 1) === 1;
}