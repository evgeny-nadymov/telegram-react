import { getBitAllignedNumber, isBitSet } from '../Utils/Common';

const syncByte1 = 0xFF;
const syncByte2 = 0xFB;

const VersionID = [2.5, null, 2, 1];
const LayerDescription = [0, 3, 2, 1];
const ChannelMode = ['stereo', 'joint_stereo', 'dual_channel', 'mono'];

const bitrate_index = {
    0x01: {11: 32, 12: 32, 13: 32, 21: 32, 22: 8, 23: 8},
    0x02: {11: 64, 12: 48, 13: 40, 21: 48, 22: 16, 23: 16},
    0x03: {11: 96, 12: 56, 13: 48, 21: 56, 22: 24, 23: 24},
    0x04: {11: 128, 12: 64, 13: 56, 21: 64, 22: 32, 23: 32},
    0x05: {11: 160, 12: 80, 13: 64, 21: 80, 22: 40, 23: 40},
    0x06: {11: 192, 12: 96, 13: 80, 21: 96, 22: 48, 23: 48},
    0x07: {11: 224, 12: 112, 13: 96, 21: 112, 22: 56, 23: 56},
    0x08: {11: 256, 12: 128, 13: 112, 21: 128, 22: 64, 23: 64},
    0x09: {11: 288, 12: 160, 13: 128, 21: 144, 22: 80, 23: 80},
    0x0A: {11: 320, 12: 192, 13: 160, 21: 160, 22: 96, 23: 96},
    0x0B: {11: 352, 12: 224, 13: 192, 21: 176, 22: 112, 23: 112},
    0x0C: {11: 384, 12: 256, 13: 224, 21: 192, 22: 128, 23: 128},
    0x0D: {11: 416, 12: 320, 13: 256, 21: 224, 22: 144, 23: 144},
    0x0E: {11: 448, 12: 384, 13: 320, 21: 256, 22: 160, 23: 160}
};

const sampling_rate_freq_index = {
    1: {0x00: 44100, 0x01: 48000, 0x02: 32000},
    2: {0x00: 22050, 0x01: 24000, 0x02: 16000},
    2.5: {0x00: 11025, 0x01: 12000, 0x02: 8000}
};

const samplesInFrameTable = [
    /* Layer   I    II   III */
    [0, 384, 1152, 1152], // MPEG-1
    [0, 384, 1152, 576] // MPEG-2(.5
];

export default class MP3Parser {
    constructor(buffer) {
        this.buffer = buffer;
        this.buf_frame_header = Buffer.alloc(4);
        this.buf_frame_header2 = Buffer.alloc(4);
        this.buf_frame_header3 = Buffer.alloc(4);
        this.framesStart = 0;
        this.frameSize = 0;
    }

    sync(){
        let gotFirstSync = false;
        let bo = 0;
        while(true) {
            if (gotFirstSync && (this.buffer[bo] & 0xFF) === syncByte2) {
                this.buf_frame_header[0] = this.buffer[bo - 1];
                this.buf_frame_header[1] = this.buffer[bo];
                this.buf_frame_header[2] = this.buffer[bo + 1];
                this.buf_frame_header[3] = this.buffer[bo + 2];

                this.framesStart = bo - 1;

                const buf = this.buffer;
                const off = this.framesStart;

                // B(20,19): MPEG Audio versionIndex ID
                this.versionIndex = getBitAllignedNumber(buf, off + 1, 3, 2);
                // C(18,17): Layer description
                this.layer = LayerDescription[getBitAllignedNumber(buf, off + 1, 5, 2)];

                // E(15,12): Bitrate index
                this.bitrateIndex = getBitAllignedNumber(buf, off + 2, 0, 4);
                // F(11,10): Sampling rate frequency index
                this.sampRateFreqIndex = getBitAllignedNumber(buf, off + 2, 4, 2);
                // G(9): Padding bit
                this.padding = isBitSet(buf, off + 2, 6);
                // H(8): Private bit
                this.privateBit = isBitSet(buf, off + 2, 7);
                // I(7,6): Channel Mode
                this.channelModeIndex = getBitAllignedNumber(buf, off + 3, 0, 2);
                // J(5,4): Mode extension (Only used in Joint stereo)
                this.modeExtension = getBitAllignedNumber(buf, off + 3, 2, 2);
                // K(3): Copyright
                this.isCopyrighted = isBitSet(buf, off + 3, 4);
                // L(2): Original
                this.isOriginalMedia = isBitSet(buf, off + 3, 5);
                // M(3): The original bit indicates, if it is set, that the frame is located on its original media.
                this.emphasis = getBitAllignedNumber(buf, off + 3, 7, 2);

                // D(16): Protection bit (if true 16-bit CRC follows header)
                this.isProtectedByCRC = !isBitSet(buf, off + 1, 7);

                this.version = VersionID[this.versionIndex];
                this.channelMode = ChannelMode[this.channelModeIndex];
                this.codec = `MPEG ${this.version} Layer ${this.layer}`;

                console.log('[MP4Parser] header', this.framesStart, this.buf_frame_header, this);

                // Calculate bitrate
                const bitrateInKbps = this.calcBitrate();
                if (!bitrateInKbps) {
                    throw new Error('Cannot determine bit-rate');
                }
                this.bitrate = bitrateInKbps * 1000;

                // Calculate sampling rate
                this.samplingRate = this.calcSamplingRate();
                if (this.samplingRate == null) {
                    throw new Error('Cannot determine sampling-rate');
                }

                const slot_size = this.calcSlotSize();
                if (slot_size === null) {
                    throw new Error('invalid slot_size');
                }

                const samples_per_frame = this.calcSamplesPerFrame();
                // debug(`samples_per_frame=${samples_per_frame}`);
                const bps = samples_per_frame / 8.0;
                const fsize = (bps * this.bitrate / this.samplingRate) +
                    ((this.padding) ? slot_size : 0);
                this.frame_size = Math.floor(fsize);

                this.buf_frame_header2[0] = this.buffer[this.framesStart + this.frame_size];
                this.buf_frame_header2[1] = this.buffer[this.framesStart + this.frame_size + 1];
                this.buf_frame_header2[2] = this.buffer[this.framesStart + this.frame_size + 2];
                this.buf_frame_header2[3] = this.buffer[this.framesStart + this.frame_size + 3];

                this.buf_frame_header3[0] = this.buffer[this.framesStart + 2 * this.frame_size];
                this.buf_frame_header3[1] = this.buffer[this.framesStart + 2 * this.frame_size + 1];
                this.buf_frame_header3[2] = this.buffer[this.framesStart + 2 * this.frame_size + 2];
                this.buf_frame_header3[3] = this.buffer[this.framesStart + 2 * this.frame_size + 3];

                return this.framesStart;
            } else {
                gotFirstSync = false;
                bo = this.buffer.indexOf(syncByte1, bo);
                if (bo === -1) {
                    return -1;
                } else {
                    bo++;
                    gotFirstSync = true;
                }
            }
        }
    }

    calcSlotSize() {
        return [null, 4, 1, 1][this.layer];
    }

    calcDuration(numFrames) {
        return numFrames * this.calcSamplesPerFrame() / this.samplingRate;
    }

    calcSamplesPerFrame() {
        return samplesInFrameTable[this.version === 1 ? 0 : 1][this.layer];
    }

    calcBitrate() {
        if (this.bitrateIndex === 0x00 || // free
            this.bitrateIndex === 0x0F) { // reserved
            return;
        }
        const codecIndex = `${Math.floor(this.version)}${this.layer}`;
        return bitrate_index[this.bitrateIndex][codecIndex];
    }

    calcSamplingRate() {
        console.log('calcSamplingRate', this.version, this.sampRateFreqIndex);
        if (this.sampRateFreqIndex === 0x03) return null; // 'reserved'
        return sampling_rate_freq_index[this.version][this.sampRateFreqIndex];
    }

    parse() {

    }
}