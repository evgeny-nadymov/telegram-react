import {ID3v1Header} from './ID3v1Token';
import {Id3v1StringType} from '../../Utils/Token';

export class ID3v1Parser {
    parse(buffer) {
        if (buffer.length < 128) {
            console.log('[ID3v1Parser] Skip checking for ID3v1 because the file-size is less than 128 bytes');
            return null;
        }

        return ID3v1Header.get(buffer, buffer.length - ID3v1Header.len);
    }
}

export function hasID3v1Header(buffer) {
    if (buffer.length >= 128) {
        const tag = Id3v1StringType.get(buffer, buffer.length - 128, 3);
        return tag === 'TAG';
    }
    return false;
}