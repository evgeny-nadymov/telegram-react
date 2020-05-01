import { ExtendedHeader, ID3v2Header } from './ID3v2Token';
import { strtokBITSET } from '../../Utils/Common';
import { ASCII_TEXT, UINT24_BE, UINT32_BE, UINT32SYNCSAFE } from '../../Utils/Token';
import { FrameParser } from './FrameParser';

export class ID3v2Parser {
    static removeUnsyncBytes(buffer) {
        let readI = 0;
        let writeI = 0;
        while (readI < buffer.length - 1) {
            if (readI !== writeI) {
                buffer[writeI] = buffer[readI];
            }
            readI += (buffer[readI] === 0xFF && buffer[readI + 1] === 0) ? 2 : 1;
            writeI++;
        }
        if (readI < buffer.length) {
            buffer[writeI++] = buffer[readI];
        }
        return buffer.slice(0, writeI);
    }

    static readFrameData(buf, frameHeader, majorVer, includeCovers, warningCollector) {
        const frameParser = new FrameParser(majorVer, warningCollector);
        switch (majorVer) {
            case 2:
                return frameParser.readData(buf, frameHeader.id, includeCovers);
            case 3:
            case 4:
                if (frameHeader.flags.format.unsynchronisation) {
                    buf = ID3v2Parser.removeUnsyncBytes(buf);
                }
                if (frameHeader.flags.format.data_length_indicator) {
                    buf = buf.slice(4, buf.length);
                }
                return frameParser.readData(buf, frameHeader.id, includeCovers);
            default:
                throw new Error('Unexpected majorVer: ' + majorVer);
        }
    }

    static readFrameFlags(b) {
        return {
            status: {
                tag_alter_preservation: strtokBITSET.get(b, 0, 6),
                file_alter_preservation: strtokBITSET.get(b, 0, 5),
                read_only: strtokBITSET.get(b, 0, 4)
            },
            format: {
                grouping_identity: strtokBITSET.get(b, 1, 7),
                compression: strtokBITSET.get(b, 1, 3),
                encryption: strtokBITSET.get(b, 1, 2),
                unsynchronisation: strtokBITSET.get(b, 1, 1),
                data_length_indicator: strtokBITSET.get(b, 1, 0)
            }
        };
    }

    static readFrameHeader(v, majorVer) {
        let header;
        switch (majorVer) {

            case 2:
                header = {
                    id: ASCII_TEXT.get(v, 0, 3),
                    length: UINT24_BE.get(v, 3)
                };
                break;

            case 3:
                header = {
                    id: ASCII_TEXT.get(v, 0, 4),
                    length: UINT32_BE.get(v, 4),
                    flags: ID3v2Parser.readFrameFlags(v.slice(8, 10))
                };
                break;

            case 4:
                header = {
                    id: ASCII_TEXT.get(v, 0, 4),
                    length: UINT32SYNCSAFE.get(v, 4),
                    flags: ID3v2Parser.readFrameFlags(v.slice(8, 10))
                };
                break;

            default:
                throw new Error('Unexpected majorVer: ' + majorVer);
        }

        return header;
    }

    static getFrameHeaderLength(majorVer) {
        switch (majorVer) {
            case 2:
                return 6;
            case 3:
            case 4:
                return 10;
            default:
                throw new Error('header versionIndex is incorrect');
        }
    }

    parseMetadata(data) {
        let offset = 0;
        const tags = [];

        while (true) {
            if (offset === data.length) break;

            const frameHeaderLength = ID3v2Parser.getFrameHeaderLength(this.id3Header.version.major);
            if (offset + frameHeaderLength > data.length) {
                console.log('Illegal ID3v2 tag length');
                break;
            }

            const frameHeaderBytes = data.slice(offset, offset += frameHeaderLength);
            const frameHeader = ID3v2Parser.readFrameHeader(frameHeaderBytes, this.id3Header.version.major);

            // Last frame. Check first char is a letter, bit of defensive programming
            if (frameHeader.id === '' || frameHeader.id === '\u0000\u0000\u0000\u0000' || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(frameHeader.id[0]) === -1) {
                console.log('Illegal ID3v2 tag header', frameHeaderBytes, frameHeader.id);
                break;
            }

            const frameDataBytes = data.slice(offset, offset += frameHeader.length);
            const values = ID3v2Parser.readFrameData(frameDataBytes, frameHeader, this.id3Header.version.major, true, []);

            console.log('[ID3v2Parser] parseMetadata', offset, frameHeader.length, frameHeader.id, values);
            tags.push({ id: frameHeader.id, value: values });
        }
        return tags;
    }

    parseExtendedHeader(buffer) {
        const extendedHeader = ExtendedHeader.get(buffer, 10);

        return this.parseId3Data(buffer, this.id3Header.size + extendedHeader.size + 4, this.id3Header.size);
    }

    parseId3Data(buf, offset, dataLen) {
        const buffer = buf.slice(offset, offset + dataLen);
        return this.parseMetadata(buffer)
    }

    parse(buffer) {
        const id3Header = ID3v2Header.get(buffer, 0);

        this.id3Header = id3Header;
        if (id3Header.fileIdentifier !== 'ID3') {
            throw new Error('expected ID3-header file-identifier \'ID3\' was not found');
        }

        if (id3Header.flags.isExtendedHeader) {
            return this.parseExtendedHeader(buffer);
        } else {
            return this.parseId3Data(buffer, ID3v2Header.len, id3Header.size);
        }
    }
}

export function hasID3v2Header(buffer) {
    if (buffer.length > 10) {
        const tag = ASCII_TEXT.get(buffer, 0, 3);
        return tag === 'ID3';
    }
    return false;
}