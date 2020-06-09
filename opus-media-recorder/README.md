# opus-media-recorder

* [Try it!](https://kbumsik.io/opus-media-recorder/)
* [JS Fiddle example](https://jsfiddle.net/kbumsik/v3wpnxao/)

`opus-media-recorder` is a [MediaRecorder API](https://w3c.github.io/mediacapture-record/#mediarecorder-api) polyfill written in ES6 and WebAssembly. It aims for cross-browser Opus codec support with various audio formats such as Ogg and WebM. `opus-media-recorder` can be used as a polyfill, or it can replace the built-in MediaRecorder since `opus-media-recorder` supports more MIME types.

`opus-media-recorder` uses WebAssembly compiled from popular libraries (e.g libopus, libogg, libwebm, and speexdsp) to ensure good performance and standards-compliance.

- [Why opus-media-recorder?](#why-opus-media-recorder)
- [How to use](#how-to-use)
  - [Thing to know](#thing-to-know)
  - [JavaScript](#javascript)
    - [Examples](#examples)
    - [Installation](#installation)
    - [Working with a bundler](#working-with-a-bundler)
    - [Simple JavaScript example (webpack)](#simple-javascript-example-webpack)
  - [HTML `<script>` tag](#html-script-tag)
  - [Use opus-media-recorder only when a browser doesn't support it](#use-opus-media-recorder-only-when-a-browser-doesnt-support-it)
- [Browser support](#browser-support)
- [MIME Type support](#mime-type-support)
- [Limitations](#limitations)
- [How to build](#how-to-build)
- [Changelog](#changelog)

## Why opus-media-recorder?

|              | opus-media-recorder | Chrome | Firefox | iOS | Edge |
|--------------|:-------------------:|:------:|:-------:|:---:|:----:|
| `audio/ogg`  |          O          |    X   |    O    |  X  |   X  |
| `audio/webm` |          O          |    O   |    X    |  X  |   X  |
| `audio/wav`  |          O          |    X   |    X    |  X  |   X  |

\* Both `audio/ogg` and `audio/webm` refer containers for Opus audio codec.

Currently the MediaRecorder API suffers from the two problems:

1. Not all browsers support MediaRecorder.
2. Even the browsers that provides MediaRecorder don't support the same format.

`opus-media-recorder` tackles these problems by supporting all major modern browsers (Chrome, Firefox, iOS, and Edge) and by providing various formats.

By taking advantages of WebAssembly and Web Workers, `opus-media-recorder` tries to have minimum performace penalties of running encoders in a browser.

## How to use

opus-media-recorder is compatible with the [Mediastream Recording API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) standard.

### Thing to know

* The page must be served over HTTPS in order to record.
* Being able to record does *not always* mean you can play it in a browser:
  * macOS/iOS Safari cannot play Opus natively yet.
  * Old Edge requires [an extension](https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6513488-ogg-vorbis-and-opus-audio-formats-support-firefox) to play Opus natively.
  * You can get an Opus decorder to play it. There are Opus decoders available, such as [Chris Rudmin's Opus decoder](https://github.com/chris-rudmin/opus-recorder).
  * Otherwise, users can download as a recording file and play it using apps like [VLC](https://www.videolan.org/vlc/index.html).
* When `mimeType` is not specified a default encoder is loaded depending on OS:
  * Chrome: `audio/webm`
  * Firefox: `audio/ogg`
  * Edge: `audio/webm`
  * iOS/macOS Safari: `audio/wave` - because they cannot play Opus at all.

### JavaScript

For standard usages of `MediaRecorder`, see the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) and other online resources. Our [testing website](docs) and [example section](example) may be useful as well.

#### Examples

* [Webpack](example/webpack)
* [create-react-app](example/create-react-app)
* [Rollup](example/rollup)
* [Browserify](example/browserify)

#### Installation

```bash
npm install --save-dev opus-media-recorder
```

#### Working with a bundler

Because `opus-media-recorder` needs to load a dedicated web worker and `.wasm` binaries, special configurations are necessary. In general:

```javascript
import OpusMediaRecorder from 'opus-media-recorder';
// Choose desired format like audio/webm. Default is audio/ogg
const options = { mimeType: 'audio/ogg' }
// Web worker and .wasm configuration. Note: This is NOT a part of W3C standard.
const workerOptions = {
  encoderWorkerFactory: function () {
    // UMD should be used if you don't use a web worker bundler for this.
    return new Worker('.../path/to/opus-media-recorder/encoderWorker.umd.js')
  },
  OggOpusEncoderWasmPath: '.../path/to/opus-media-recorder/OggOpusEncoder.wasm',
  WebMOpusEncoderWasmPath: '.../path/to/opus-media-recorder/WebMOpusEncoder.wasm'
};

window.MediaRecorder = OpusMediaRecorder;
recorder = new MediaRecorder(stream, options, workerOptions);
```

#### Simple JavaScript example (webpack)

```javascript
import MediaRecorder from 'opus-media-recorder';
// Use worker-loader
import EncoderWorker from 'worker-loader!opus-media-recorder/encoderWorker.js';
// You should use file-loader in webpack.config.js.
// See webpack example link in the above section for more detail.
import OggOpusWasm from 'opus-media-recorder/OggOpusEncoder.wasm';
import WebMOpusWasm from 'opus-media-recorder/WebMOpusEncoder.wasm';

// Non-standard options
const workerOptions = {
  encoderWorkerFactory: _ => new EncoderWorker(),
  OggOpusEncoderWasmPath: OggOpusWasm,
  WebMOpusEncoderWasmPath: WebMOpusWasm
};

let recorder;

function startRecording () {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    let options = { mimeType: 'audio/ogg' };
    // Start recording
    recorder = new MediaRecorder(stream, options, workerOptions);
    recorder.start();
    // Set record to <audio> when recording will be finished
    recorder.addEventListener('dataavailable', (e) => {
      audioElement.src = URL.createObjectURL(e.data);
    });
  });
}

// Recording should be started in user-initiated event like buttons
recordButton.addEventListener('click', startRecording);

// Stop recording
stopButton.addEventListener('click', () => {
  recorder.stop();
  // Remove “recording” icon from browser tab
  recorder.stream.getTracks().forEach(i => i.stop());
})
```

### HTML `<script>` tag

The `OpusMediaRecorder` object is available in the global namespace using [UMD](https://github.com/umdjs/umd).

```html
<!-- load OpusMediaRecorder.umd.js. OpusMediaRecorder will be loaded. -->
<script src="https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/OpusMediaRecorder.umd.js"></script>
<!-- load encoderWorker.umd.js. This should be after OpusMediaRecorder. -->
<!-- This script tag will create OpusMediaRecorder.encoderWorker. -->
<script src="https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/encoderWorker.umd.js"></script>

<script>
...
// If you already load encoderWorker.js using <script> tag,
// you don't need to define encoderWorkerFactory.
const workerOptions = {
  OggOpusEncoderWasmPath: 'https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/OggOpusEncoder.wasm',
  WebMOpusEncoderWasmPath: 'https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/WebMOpusEncoder.wasm'
};

// Replace MediaRecorder
window.MediaRecorder = OpusMediaRecorder;
let recorder = new MediaRecorder(stream, {}, workerOptions);
...
</script>
```

### Use opus-media-recorder only when a browser doesn't support it

```javascript
// Check if MediaRecorder available.
if (!window.MediaRecorder) {
  window.MediaRecorder = OpusMediaRecorder;
}
// Check if a target format (e.g. audio/ogg) is supported.
else if (!window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
  window.MediaRecorder = OpusMediaRecorder;
}
```

## Browser support

Supported:

* Chrome >= 58
* Firefox >= 53
* Microsoft Edge >= 41
* Safari (macOS and iOS) >= 11

Browsers with issues:

* iOS 11.2 only: Not working due to a regression in WebAssembly: https://bugs.webkit.org/show_bug.cgi?id=181781

## MIME Type support

* `audio/webm`
* `audio/webm; codecs=opus`
* `audio/ogg`
* `audio/ogg; codecs=opus`
* `audio/wav` or `audio/wave`

## Limitations

* Does not support Video recording.
* `opus-media-recorder` throws generic Error objects instead of native DOMException.
* Because `audio/wav` is not designed for streaming, when `mimeType` is `audio/wav`, each `dataavailabe` events produces a complete and separated `.wav` file that cannot be concatenated together unlike Ogg and WebM. Therefore, it is recommended not to use `timeslice` option when calling `start()`, unless you know what the implication is.
* There is no [`SecurityError`](https://w3c.github.io/mediacapture-record/#exception-summary) case implemented. (WIP)

## How to build

1. To build from the source, you need [Emscripten](https://github.com/kripken/emscripten), [yarn](https://yarnpkg.com), Python 2.7 or higher, and basic C program build systems such as [GNU Make](https://www.gnu.org/software/make/).

2. `yarn install` to install JavaScript dependencies.

3. `yarn run build` to build. `yarn run build:production` to build files for distribution.

4. `yarn run serve` to run a test web server locally. Default URL is `https://localhost:9000` (It has to be HTTPS). You might have to change `DEV_SERVER_URL` and `DEV_SERVER_PORT` to change the address of the local test server.

5. `yarn run clean` to clean up build files.

### Using Docker



## Changelog

See [CHANGELOG.md](CHANGELOG.md).
