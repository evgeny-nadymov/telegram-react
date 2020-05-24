/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MP4Box from 'mp4box';
import { LOG, logSourceBufferRanges } from '../Utils/Common';

export default class MP4Source {
    constructor(video, getBufferAsync) {
        this.mp4file = null;
        this.nextBufferStart = 0;
        this.mediaSource = null;
        this.ready = false;

        this.beforeMoovBufferSize = 32 * 1024;
        this.moovBufferSize = 512 * 1024;
        this.bufferSize = 512 * 1024;
        this.currentBufferSize = this.beforeMoovBufferSize;
        this.nbSamples = 10;
        this.video = video;
        this.getBufferAsync = getBufferAsync;

        this.seeking = false;
        this.loading = false;
        this.url = null;

        this.init();
    }

    init() {
        const mediaSource = new MediaSource();
        mediaSource.addEventListener('sourceopen', async () => {
            LOG('[MediaSource] sourceopen start', this.mediaSource, this);

            if (this.mediaSource.sourceBuffers.length > 0) return;

            const mp4File = MP4Box.createFile();
            mp4File.onMoovStart = () => {
                LOG('[MP4Box] onMoovStart');
                this.currentBufferSize = this.moovBufferSize;
            };
            mp4File.onError = error => {
                LOG('[MP4Box] onError', error);
            };
            mp4File.onReady = info => {
                LOG('[MP4Box] onReady', info);
                this.ready = true;
                this.currentBufferSize = this.bufferSize;
                const { isFragmented, timescale, fragment_duration, duration } = info;

                this.mediaSource.duration = isFragmented
                    ? fragment_duration / timescale
                    : duration / timescale;

                for (let i = 0; i < info.tracks.length; i++) {
                    this.addSourceBuffer(mp4File, this.mediaSource, info.tracks[i]);
                }

                const initSegs = mp4File.initializeSegmentation();
                LOG('[MP4Box] initializeSegmentation', initSegs);

                for (let i = 0; i < initSegs.length; i++) {
                    const { user: sourceBuffer } = initSegs[i];
                    sourceBuffer.onupdateend = () => {
                        sourceBuffer.initSegs = true;
                        sourceBuffer.onupdateend = this.handleSourceBufferUpdateEnd;
                    };
                    sourceBuffer.appendBuffer(initSegs[i].buffer);
                }

                LOG('[MP4Box] start fragmentation');
                mp4File.start();
            };
            mp4File.onSegment = (id, sourceBuffer, buffer, sampleNum, is_last) => {
                const isLast = (sampleNum + this.nbSamples) > sourceBuffer.nb_samples;

                LOG('[MP4Box] onSegment', id, buffer, `${sampleNum}/${sourceBuffer.nb_samples}`, isLast, sourceBuffer.timestampOffset);
                sourceBuffer.pendingUpdates.push({ id, buffer, isLast });
                if (sourceBuffer.initSegs && !sourceBuffer.updating) {
                    this.handleSourceBufferUpdateEnd({ target: sourceBuffer });
                }
            };

            this.nextBufferStart = 0;
            this.mp4file = mp4File;
            LOG('[MediaSource] sourceopen end', this, this.mp4file);

            this.loadNextBuffer();
        });
        mediaSource.addEventListener('sourceended', () => {
            LOG('[MP3Source] sourceended', mediaSource.readyState);
        });
        mediaSource.addEventListener('sourceclose', () => {
            LOG('[MP3Source] sourceclose', mediaSource.readyState);
        });

        this.mediaSource = mediaSource;
    }

    addSourceBuffer(file, source, track) {
        if (!track) return null;

        const { id, codec, type: trackType, nb_samples } = track;
        const type = `video/mp4; codecs="${codec}"`;
        if (!MediaSource.isTypeSupported(type)) {
            LOG('[addSourceBuffer] not supported', type);
            return null;
        }
        // if (trackType !== 'video') {
        //     LOG('[addSourceBuffer] skip', trackType);
        //     return null;
        // }

        const sourceBuffer = source.addSourceBuffer(type);
        sourceBuffer.id = id;
        sourceBuffer.pendingUpdates = [];
        sourceBuffer.nb_samples = nb_samples;
        file.setSegmentOptions(id, sourceBuffer, { nbSamples: this.nbSamples });
        LOG('[addSourceBuffer] add', id, codec, trackType);

        return sourceBuffer;
    }

    handleSourceBufferUpdateEnd = event => {
        const sourceBuffer = event.target;

        // const video = document.getElementById('v');

        logSourceBufferRanges(sourceBuffer, 0, 0);

        if (!sourceBuffer) return;
        if (sourceBuffer.updating) return;

        const { pendingUpdates } = sourceBuffer;
        if (!pendingUpdates) return;
        if (!pendingUpdates.length) {
            if (sourceBuffer.isLast && this.mediaSource.readyState === 'open') {
                LOG('[SourceBuffer] updateend endOfStream start', sourceBuffer.id);
                if (Array.from(this.mediaSource.sourceBuffers).every(x => !x.pendingUpdates.length && !x.updating)) {
                    this.mediaSource.endOfStream();
                    LOG('[SourceBuffer] updateend endOfStream stop', sourceBuffer.id);
                }
            }
            return;
        }

        const update = pendingUpdates.shift();
        if (!update) return;

        const { buffer, isLast } = update;

        LOG('[SourceBuffer] updateend end', sourceBuffer.id, sourceBuffer.pendingUpdates.length);
        sourceBuffer.isLast = isLast;
        sourceBuffer.appendBuffer(buffer);
    };

    getURL() {
        this.url = this.url || URL.createObjectURL(this.mediaSource);

        return this.url;
    }

    seek(time) {
        const seekInfo = this.mp4file.seek(time, true);
        this.nextBufferStart = seekInfo.offset;
        LOG('[player] seeked', time, seekInfo, this.nextBufferStart);
    }

    async loadNextBuffer() {
        const { nextBufferStart, currentBufferSize, mp4file } = this;
        LOG('[MP4Box] handleAppend start', nextBufferStart, mp4file);

        if (nextBufferStart === undefined) return;
        if (this.loading) return;

        this.loading = true;
        const nextBuffer = await this.getBufferAsync(nextBufferStart, nextBufferStart + currentBufferSize);
        nextBuffer.fileStart = nextBufferStart;

        if (nextBuffer.byteLength) {
            this.nextBufferStart = mp4file.appendBuffer(nextBuffer);
            LOG('[MP4Box] handleAppend stop', nextBufferStart, this.nextBufferStart);
        } else {
            this.nextBufferStart = undefined;
            LOG('[MP4Box] handleAppend stop', nextBufferStart, this.nextBufferStart);
        }

        if (nextBuffer.byteLength < currentBufferSize) {
            LOG('[MP4Box] handleAppend flush');
            this.mp4file.flush();
        }

        this.loading = false;

        if (!this.ready) {
            this.loadNextBuffer();
        }
    }
}