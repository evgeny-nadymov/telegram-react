import { strtokBITSET } from '../../Utils/Common';
import { UINT16_BE, UINT32_BE, ASCII_TEXT, UINT32SYNCSAFE } from '../../Utils/Token';

/**
 * ID3v2 header
 * Ref: http://id3.org/id3v2.3.0#ID3v2_header
 */
export const ID3v2Header = {
    get: (buffer, offset) => {
        // ID3v2/file identifier   'ID3'
        const fileIdentifier = ASCII_TEXT.get(buffer, offset, 3); // new TextDecoder('ascii').decode(buffer.slice(offset, 3));

        // ID3v2 versionIndex
        const version = {
            major: buffer[offset + 3],
            revision: buffer[offset + 4]
        };

        // ID3v2 flags
        const flags = {
            raw: buffer[offset + 5],
            // Unsynchronisation
            unsynchronisation: strtokBITSET.get(buffer, offset + 5, 7),
            // Extended header
            isExtendedHeader: strtokBITSET.get(buffer, offset + 5, 6),
            // Experimental indicator
            expIndicator: strtokBITSET.get(buffer, offset + 5, 5),
            footer: strtokBITSET.get(buffer, offset + 5, 4)
        };

        // ID3v2 size
        // The ID3v2 tag size is the size of the complete tag after unsychronisation, including padding, excluding the header but not excluding the extended header
        const size = UINT32SYNCSAFE.get(buffer, offset + 6);

        return {
            fileIdentifier,
            version,
            flags,
            size
        };
    },
    len: 10
}

/**
 * ID3v2 header
 * Ref: http://id3.org/id3v2.3.0#ID3v2_extended_header
 */
export const ExtendedHeader = {
    len: 10,

    get: (buf, off) => {
        // Extended header size (10 or 6 excluding itself)
        const size = UINT32_BE.get(buf, off);

        // Extended Flags
        const extendedFlags = UINT16_BE.get(buf, off + 4);

        // Size of padding
        const sizeOfPadding = UINT32_BE.get(buf, off + 6);

        // CRC data present
        const crcDataPresent = strtokBITSET.get(buf, off + 4, 31);

        const crcData = crcDataPresent ? UINT32_BE.get(buf, off + 10) : null;

        return {
            size,
            extendedFlags,
            sizeOfPadding,
            crcDataPresent,
            crcData
        };
    }
}

export const TextEncodingToken = {
    len: 1,

    get: (buf, off) => {
        switch (buf[off]) {
            case 0x00:
                return { encoding: 'iso-8859-1' }; // binary
            case 0x01:
                return { encoding: 'utf16', bom: true };
            case 0x02:
                return { encoding: 'utf16', bom: false };
            case 0x03:
                return { encoding: 'utf8', bom: false };
            default:
                return { encoding: 'utf8', bom: false };

        }
    }
};