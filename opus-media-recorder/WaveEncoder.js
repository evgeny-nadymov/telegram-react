const { writeString } = require('./commonFunctions.js');

const BYTES_PER_SAMPLE = Int16Array.BYTES_PER_ELEMENT; // This means 16-bit wav file.

class WaveEncoder {
  /**
   * Contructor
   */
  constructor (inputSampleRate, channelCount, bitsPerSecond) {
    this.config = {
      inputSampleRate,
      channelCount
    };
    this.encodedBuffers = [];
  }

  /**
   * Encode buffers and then store.
   * @param {Float32Array[]} channelBuffers - original array of Float32Array.buffer
   *                                         from inputBuffer.getChannelData().
   */
  encode (channelBuffers) {
    const length = channelBuffers[0].length; // Number of frames, in other words, the length of each channelBuffers.
    const encodedBuffer = new ArrayBuffer(length * BYTES_PER_SAMPLE * this.config.channelCount);
    const encodedView = new DataView(encodedBuffer);

    // Convert Float32 to Int16
    for (let ch = 0; ch < this.config.channelCount; ch++) {
      let channelSamples = channelBuffers[ch];

      for (let i = 0; i < length; i++) {
        // Clamp value
        let sample = (channelSamples[i] * 0x7FFF) | 0;
        if (sample > 0x7FFF) {
          sample = 0x7FFF | 0;
        } else if (sample < -0x8000) {
          sample = -0x8000 | 0;
        }
        // Then store
        const offset = (i * this.config.channelCount + ch) * BYTES_PER_SAMPLE;
        encodedView.setInt16(offset, sample | 0, true);
      }
    }
    this.encodedBuffers.push(encodedBuffer);
  }

  /**
   * Create and return a header buffer.
   */
  getHeader () {
    /**
     * Get stored encoding result with Wave file format header
     * Reference: http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
     */
    // Create header data
    let dataLength = this.encodedBuffers.reduce((acc, cur) => acc + cur.byteLength, 0);
    let header = new ArrayBuffer(44);
    let view = new DataView(header);
    // RIFF identifier 'RIFF'
    writeString(view, 0, 'RIFF');
    // file length minus RIFF identifier length and file description length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type 'WAVE'
    writeString(view, 8, 'WAVE');
    // format chunk identifier 'fmt '
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, this.config.channelCount, true);
    // sample rate
    view.setUint32(24, this.config.inputSampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, this.config.inputSampleRate * BYTES_PER_SAMPLE * this.config.channelCount, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, BYTES_PER_SAMPLE * this.config.channelCount, true);
    // bits per sample
    view.setUint16(34, 8 * BYTES_PER_SAMPLE, true);
    // data chunk identifier 'data'
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataLength, true);

    return header;
  }
}

/**
 * As the name states, it emulates Emscripten module behavior.
 * @param {EmscriptenModule} Module
 */
function emscriptenModuleEmulator (Module) {
  return new Promise(function (resolve, reject) {
    Module = typeof Module !== 'undefined' ? (Module || {})
                                           : {};

    /**
     * Define the encoder module interface. The worker will interact with
     * the encoder via those functions only.
     */
    Module.init = function (inputSampleRate, channelCount, bitsPerSecond) {
      Module.encoder = new WaveEncoder(inputSampleRate, channelCount, bitsPerSecond);
    };

    Module.encode = function (buffers) {
      Module.encoder.encode(buffers);
    };

    Module.flush = function () {
      let header = Module.encoder.getHeader();
      let body = Module.encoder.encodedBuffers.splice(0, Module.encoder.encodedBuffers.length);
      return [header, ...body];
    };

    Module.close = function () {
      // Nothing to do.
    };

    resolve(Module);
  });
}

module.exports = emscriptenModuleEmulator;
