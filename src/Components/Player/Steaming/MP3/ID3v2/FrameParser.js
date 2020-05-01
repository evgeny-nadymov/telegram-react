import {TextEncodingToken} from './ID3v2Token';
import {decodeString} from '../../Utils/Common';

const defaultEnc = 'iso-8859-1';

export class FrameParser {

    /**
     * Create id3v2 frame parser
     * @param major - Major version, e.g. (4) for  id3v2.4
     */
    constructor(major)  {
        this.major = major;
    }

    readData(b, type) {

        if (b.length === 0) {
            console.log(`id3v2.${this.major} header has empty tag type=${type}`);
            return;
        }

        const {encoding, bom} = TextEncodingToken.get(b, 0);
        let output = [];

        console.debug(`Parsing tag type=${type}, encoding=${encoding}, bom=${bom}`);
        switch (type) {
            case 'TPE1': // 4.2.1. Text information frames - details
            case 'TIT2': {
                const text = decodeString(b.slice(1), encoding).replace(/\x00+$/, '');
                output = this.major >= 4 ? this.splitValue(type, text) : [text];
            }
            default:
                //console.log('Warning: unsupported id3v2-tag-type: ' + type);
                break;
        }

        return output;
    }

    /**
     * id3v2.4 defines that multiple T* values are separated by 0x00
     * id3v2.3 defines that TCOM, TEXT, TOLY, TOPE & TPE1 values are separated by /
     * @param tag - Tag name
     * @param text - Concatenated tag value
     * @returns Split tag value
     */
    splitValue(tag, text) {
        let values;
        if (this.major < 4) {
            values = text.split(/\x00/g);
            if (values.length > 1) {
                console.log(`ID3v2.${this.major} ${tag} uses non standard null-separator.`);
            } else {
                values = text.split(/\//g);
            }
        } else {
            values = text.split(/\x00/g);
        }
        return FrameParser.trimArray(values);
    }

    static trimArray(values) {
        return values.map(value => value.replace(/\x00+$/, '').trim());
    }
}