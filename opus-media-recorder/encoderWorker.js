function initWorker (workerGlobalScope) {
  const WaveEncoder = require('./WaveEncoder.js');
  const WebMOpusEncoder = require('./WebMOpusEncoder.js');
  const OggOpusEncoder = require('./OggOpusEncoder.js');

  let encoder;

  workerGlobalScope.onmessage = function (e) {
    const { command } = e.data;
    switch (command) {
      case 'loadEncoder':
        const { mimeType, wasmPath } = e.data;
        // Setting encoder module
        let encoderModule;
        switch (mimeType) {
          case 'audio/wav':
          case 'audio/wave':
            encoderModule = WaveEncoder;
            break;

          case 'audio/webm':
            encoderModule = WebMOpusEncoder;
            break;

          case 'audio/ogg':
            encoderModule = OggOpusEncoder;
            break;
        }
        // Override Emscripten configuration
        let moduleOverrides = {};
        if (wasmPath) {
          moduleOverrides['locateFile'] = function (path, scriptDirectory) {
            return path.match(/.wasm/) ? wasmPath : (scriptDirectory + path);
          };
        }
        // Initialize the module
        encoderModule(moduleOverrides).then(Module => {
          encoder = Module;
          // Notify the host ready to accept 'init' message.
          self.postMessage({ command: 'readyToInit' });
        });
        break;

      case 'init':
        const { sampleRate, channelCount, bitsPerSecond } = e.data;
        encoder.init(sampleRate, channelCount, bitsPerSecond);
        break;

      case 'pushInputData':
        const { channelBuffers, length, duration } = e.data; // eslint-disable-line
        // On Chrome, Float32Array doesn't recognize its buffer after
        // being transferred, making the size of ArrayBuffer 0.
        // This bug is found in Chrome 66.0.3359.181 (2018).
        // It is fixed since 2019.
        // So re-create Float32Array right after a web worker received it.
        for (let i = 0; i < channelBuffers.length; i++) {
          channelBuffers[i] = new Float32Array(channelBuffers[i].buffer);
        }

        encoder.encode(channelBuffers);
        break;

      case 'getEncodedData':
      case 'done':
        if (command === 'done') {
          encoder.close();
        }

        const buffers = encoder.flush();
        self.postMessage({
          command: command === 'done' ? 'lastEncodedData' : 'encodedData',
          buffers
        }, buffers);

        if (command === 'done') {
          self.close();
        }
        break;

      default:
        // Ignore
        break;
    }
  };
}

/* global WorkerGlobalScope */
// Run only if it is in web worker environment
if (typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope) {
  initWorker(self);
}

/**
 * TODO: This line causes undefined symbol: __webpack_require__
 * So comment out until figuring out the solution
 */
module.exports = initWorker;
