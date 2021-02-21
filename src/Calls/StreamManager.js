/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getAmplitude } from './Utils';
import { LOG_CALL } from '../Stores/CallStore';
import { GROUP_CALL_AMPLITUDE_ANALYSE_COUNT_MAX } from '../Constants';
import TdLibController from '../Controllers/TdLibController';

export default class StreamManager {
    constructor(interval) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.interval = interval;
        this.timer = null;

        this.items = [];
        this.outputStream = new MediaStream();
        this.inputStream = null;
        this.counter = 0;
    }

    addTrack(stream, type) {
        if (!stream) return;

        const tracks = stream.getAudioTracks();
        if (!tracks.length) return;

        const track = tracks[0];
        LOG_CALL('[manager] addTrack', type, track, stream);
        if (!track) return;

        const { context, items, inputStream, outputStream } = this;

        // add analyser
        const source = type === 'input' ? stream.id : Number(stream.id.substring(6));
        const streamSource = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        const gain = context.createGain();
        const streamDestination = context.createMediaStreamDestination();

        track.e = source;
        track.onended = () => {
            // LOG_CALL('[manager] track.onended');
            this.removeTrack(track);
        };

        analyser.minDecibels = -100;
        analyser.maxDecibels = -30;
        analyser.smoothingTimeConstant = 0.05;
        analyser.fftSize = 1024;

        // connect Web Audio API
        streamSource.connect(analyser);
        // analyser.connect(context.destination);

        // this.removeTrack(track);
        switch (type) {
            case 'input': {
                if (!inputStream) {
                    this.inputStream = stream;
                } else {
                    this.inputStream.addTrack(track);
                }
                break;
            }
            case 'output': {
                for (let i = 0; i < items.length; i++) {
                    const { track: t, type } = items[i];
                    if (t.e === source && type === 'input') {
                        items.splice(i, 1);
                        outputStream.removeTrack(t);
                        break;
                    }
                }

                outputStream.addTrack(track);
                break;
            }
        }

        items.push({
            type,
            source,
            stream,
            track,
            streamSource,
            analyser,
            gain
        });

        this.changeTimer();
    }

    removeTrack(track) {
        // LOG_CALL('[manager] removeTrack', track);
        if (!track) return;

        const { items, inputStream, outputStream } = this;

        let handled = false;
        for (let i = 0; i < items.length && !handled; i++) {
            const { track: t, type } = items[i];
            switch (type) {
                case 'output': {
                    if (t === track) {
                        items.splice(i, 1);
                        outputStream.removeTrack(track);
                        handled = true;
                    }
                    break;
                }
                case 'input': {
                    if (t === track) {
                        items.splice(i, 1);
                        inputStream.removeTrack(track);
                        handled = true;
                    }
                    break;
                }
            }
        }

        this.changeTimer();
    }

    replaceInputAudio(stream, oldTrack) {
        if (!stream) return;

        this.removeTrack(oldTrack);
        this.addTrack(stream, 'input');
    }

    changeTimer() {
        const { timer, items, interval } = this;

        clearInterval(timer);
        if (items.length > 0) {
            this.timer = setInterval(() => this.analyse(), interval);
        }
    }

    getAmplitude(item) {
        const { analyser, stream, track, source, type } = item;
        if (!analyser) return;

        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const value = getAmplitude(array);

        return {
            type,
            source,
            stream,
            track,
            value
        };
    }

    analyse() {
        const { items } = this;
        const all = this.counter % 3 === 0;
        const filteredItems = all ? items : items.filter(x => x.type === 'input');
        const amplitudes = filteredItems.filter(x => x.track.kind === 'audio').slice(0, GROUP_CALL_AMPLITUDE_ANALYSE_COUNT_MAX).map(x => this.getAmplitude(x));
        this.counter++;
        if (this.counter >= 1000) {
            this.counter = 0;
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateGroupCallAmplitude',
            amplitudes,
            type: all ? 'all' : 'input'
        });
    }
}