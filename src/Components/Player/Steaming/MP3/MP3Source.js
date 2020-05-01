import { LOG, ERROR } from '../Utils/Common';

export class MP3Source {
    constructor(audio, getBufferAsync) {
        this.bufferSize = 256 * 1024;
        this.audio = audio;
        this.getBufferAsync = getBufferAsync;

        this.seeking = false;
        this.loading = false;
        this.url = null;

        this.init();
    }

    init() {
        const { audio, getBufferAsync } = this;

        const { audio: file, duration, mime_type } = audio;
        const { size } = file;

        const mediaSource = new MediaSource();

        mediaSource.addEventListener('sourceopen', async () => {
            LOG('[MP3Source] sourceopen');
            if (this.sourceBuffer) return;

            this.buffersCount = Math.ceil(size / this.bufferSize);
            mediaSource.duration = duration;

            const sourceBuffer = this.mediaSource.addSourceBuffer(mime_type);
            this.sourceBuffer = sourceBuffer;

            LOG('[MP3Source] sourceopen mode', sourceBuffer.mode);
            sourceBuffer.addEventListener('updateend', () => {
                const ranges = [];
                for (let i = 0; i < sourceBuffer.buffered.length; i++) {
                    ranges.push({ start: sourceBuffer.buffered.start(i), end: sourceBuffer.buffered.end(i)})
                }

                LOG('[MP3Source] updateend', ranges);
            });
            sourceBuffer.addEventListener('error', () => {
                ERROR('[MP3Source] error');
            });

            this.nextStart = this.bufferSize;
            sourceBuffer.timestampOffset = 0;

            const newBuffer = await getBufferAsync(0, this.bufferSize);

            // const parser = new MP4Parser(new Uint8Array(newBuffer));
            // const frameStart = await parser.sync();
            // LOG('[sourceBuffer] frameStart', frameStart);

            sourceBuffer.appendBuffer(newBuffer);
        });
        mediaSource.addEventListener('sourceended', () => {
            LOG('[MP3Source] sourceended', mediaSource.readyState);
        });
        mediaSource.addEventListener('sourceclose', () => {
            LOG('[MP3Source] sourceclose', mediaSource.readyState);
        });

        this.mediaSource = mediaSource;
    }

    getHeaderStart(buffer) {
        let headerStart = 0;
        const SyncByte1 = 0xFF;
        const SyncByte2 = 0xFB;
        const SyncByte3 = 224;
        const SyncByte4 = 64;

        const arr = new Uint8Array(buffer);

        for (let i = 0; i + 1 < arr.length; i++) {
            if (arr[i] === SyncByte1 && arr[i + 1] === SyncByte2 && arr[i + 2] === SyncByte3 && arr[i + 3] === SyncByte4) {
                LOG('[MP3Source] getHeaderStart', i, arr[i], arr[i + 1]);
                return i;
            }
        }

        return headerStart;
    }

    needNextBuffer() {
        const { sourceBuffer } = this;
        const { buffered, timestampOffset } = sourceBuffer;

        for (let i = 0; i < buffered.length; i++) {
            const end = buffered.end(i);

            if (timestampOffset + 1.0 > end) {
                return true;
            }
        }

        return false;
    }

    getURL() {
        this.url = this.url || URL.createObjectURL(this.mediaSource);

        return this.url;
    }

    async seek(time) {
        LOG('[MP3Source] seek', time);
        const { audio, mediaSource, sourceBuffer, getBufferAsync } = this;

        LOG('[MP3Source] seek readyState', mediaSource.readyState);
        if (mediaSource.readyState === 'ended') {
            sourceBuffer.timestampOffset = time;
        }

        const { duration } = audio;

        this.seeking = true;
        this.time = time;

        LOG('[MP3Source] seek abort', time);
        sourceBuffer.abort();
        LOG('[MP3Source] seek remove', time);
        sourceBuffer.remove(0, Infinity);
        sourceBuffer.onupdate = async () => {
            sourceBuffer.onupdate = null;
            LOG('[MP3Source] seek remove complete', time);

            if (this.time !== time) return;

            const currentBufferId = Math.floor(time / duration * this.buffersCount);
            sourceBuffer.timestampOffset = time;

            const start = currentBufferId * this.bufferSize;
            const end = (currentBufferId + 1) * this.bufferSize;

            const buffer = await getBufferAsync(start, end);
            if (this.time !== time) return;

            const headerStart = this.getHeaderStart(buffer);

            const start2 = headerStart + start;
            const end2 = headerStart + end;

            const nextBuffer = await getBufferAsync(start2, end2);
            this.nextStart = end2;

            LOG('[MP3Source] seek append', time, sourceBuffer.timestampOffset, [start, end], [start2, end2], headerStart);
            if (nextBuffer.byteLength > 0) {
                sourceBuffer.appendBuffer(nextBuffer);
                sourceBuffer.onupdate = () => {
                    sourceBuffer.onupdate = null;

                    this.seeking = false;
                    LOG('[MP3Source] seek append complete', time, this.nextStart);

                    if (this.needNextBuffer()) {
                        LOG('[MP3Source] seek needNextBuffer', time, sourceBuffer.timestampOffset);
                        this.loadNextBuffer(sourceBuffer.timestampOffset);
                    }
                };
            } else {
                this.seeking = false;
                if (mediaSource.readyState === 'open') {
                    mediaSource.endOfStream();
                }
            }
        };
    }

    async loadNextBuffer() {
        LOG('[MP3Source] loadNextBuffer', this.nextStart, this.seeking, this.loading, this.nextStart);
        if (this.seeking) return;
        if (this.loading) return;

        const { nextStart, mediaSource, sourceBuffer, getBufferAsync } = this;
        if (mediaSource.readyState !== 'open') {
            return;
        }

        this.loading = true;

        const start = nextStart;
        const end = nextStart + this.bufferSize;

        const nextBuffer = await getBufferAsync(start, end);
        if (this.seeking) {
            this.loading = false;
            return;
        }

        LOG('[MP3Source] loadNextBuffer append', nextStart, [start, end], nextBuffer.byteLength);
        if (nextBuffer.byteLength > 0) {
            sourceBuffer.appendBuffer(nextBuffer);
            sourceBuffer.onupdate = () => {
                sourceBuffer.onupdate = null;

                this.loading = false;
                this.nextStart = end;
                LOG('[MP3Source] loadNextBuffer append complete', nextStart, this.nextStart);
            };
        } else {
            this.loading = false;
            if (mediaSource.readyState === 'open') {
                LOG('[MP3Source] loadNextBuffer endOfStream');
                mediaSource.endOfStream();
            }
        }
    }
}