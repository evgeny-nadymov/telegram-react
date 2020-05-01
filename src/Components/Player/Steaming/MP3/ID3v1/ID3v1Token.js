import {Id3v1StringType, UINT8} from '../../Utils/Token';

/**
 * Spec: http://id3.org/ID3v1
 * Wiki: https://en.wikipedia.org/wiki/ID3
 */
export const ID3v1Header = {
    len: 128,

    /**
     * @param buf Buffer possibly holding the 128 bytes ID3v1.1 metadata header
     * @param off Offset in buffer in bytes
     * @returns ID3v1.1 header if first 3 bytes equals 'TAG', otherwise null is returned
     */
    get: (buf, off) => {
        const header = Id3v1StringType.get(buf, off, 3);
        return header === 'TAG' ? {
            header,
            title: Id3v1StringType.get(buf, off + 3, 30),
            artist: Id3v1StringType.get(buf, off + 33, 30),
            album: Id3v1StringType.get(buf, off + 63, 30),
            year: Id3v1StringType.get(buf, off + 93, 4),
            comment: Id3v1StringType.get(buf, off + 97, 28),
            // ID3v1.1 separator for track
            zeroByte: UINT8.get(buf, off + 127),
            // track: ID3v1.1 field added by Michael Mutschler
            track: UINT8.get(buf, off + 126),
            genre: UINT8.get(buf, off + 127)
        } : null;
    }
};