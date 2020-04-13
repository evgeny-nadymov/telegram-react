import { trimRightNull } from './Common';

/**
 * 28 bits (representing up to 256MB) integer, the msb is 0 to avoid 'false syncsignals'.
 * 4 * %0xxxxxxx
 */
export const UINT32SYNCSAFE = {
    get: (buf, off) => {
        return buf[off + 3] & 0x7f | (buf[off + 2] << 7) | (buf[off + 1] << 14) | (buf[off] << 21);
    },
    len: 4
};

export const UINT8 = {
    get: (buf, off) => {
        return buf[off];
    }
}

export const UINT32_BE = {
    get: (buf, off) => {
        return buf[off + 3] | (buf[off + 2] << 8) | (buf[off + 1] << 16) | (buf[off] << 24);
    }
}

export const UINT24_BE = {
    get: (buf, off) => {
        return buf[off + 2] | (buf[off + 1] << 8) | (buf[off] << 16);
    }
}

export const UINT16_BE = {
    get: (buf, off) => {
        return buf[off + 1] | (buf[off] << 8);
    }
}

export const ASCII_TEXT = {
    get: (buf, off, len) => {
        return new TextDecoder('ascii').decode(buf.slice(off, off + len));
    }
}

export const Id3v1StringType = {
    get: (buf, off, len) => {
        let value = new TextDecoder('ascii').decode(buf.slice(off, off + len));
        value = trimRightNull(value);
        value = value.trim();
        return value.length > 0 ? value : undefined;
    }
}