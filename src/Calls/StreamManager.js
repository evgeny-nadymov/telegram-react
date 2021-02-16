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
        this.inputStream = new MediaStream();
        this.outputStream = null;
        this.counter = 0;
    }

    addTrack(stream, type) {
        if (!stream) return;

        const tracks = stream.getAudioTracks();
        if (!tracks.length) return;

        const track = tracks[0];
        LOG_CALL('[manager] addTrack', type, track, stream);
        if (!track) return;

        const { context, items, inputStream } = this;

        // add analyser
        const source = type === 'output' ? stream.id : Number(stream.id.substring(6));
        const streamSource = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();

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

        this.removeTrack(track);

        switch (type) {
            case 'input': {
                for (let i = 0; i < items.length; i++) {
                    const { track: t, type } = items[i];
                    if (t.e === source && type === 'input') {
                        items.splice(i, 1);
                        inputStream.removeTrack(t);
                        break;
                    }
                }

                inputStream.addTrack(track);
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
        });

        this.changeTimer();
    }

    removeTrack(track) {
        // LOG_CALL('[manager] removeTrack', track);
        if (!track) return;

        const { items, inputStream } = this;

        let handled = false;
        for (let i = 0; i < items.length && !handled; i++) {
            const { track: t, type } = items[i];
            switch (type) {
                case 'input': {
                    if (t === track) {
                        items.splice(i, 1);
                        inputStream.removeTrack(track);
                        handled = true;
                    }
                    break;
                }
                case 'output': {
                    if (t === track) {
                        items.splice(i, 1);
                        handled = true;
                    }
                    break;
                }
            }
        }

        this.changeTimer();
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
        const filteredItems = this.counter % 3 === 0 ? items : items.filter(x => x.type === 'output');
        const amplitudes = filteredItems.slice(0, GROUP_CALL_AMPLITUDE_ANALYSE_COUNT_MAX).map(x => this.getAmplitude(x));
        this.counter++;
        if (this.counter >= 10) {
            this.counter = 0;
        }

        // LOG_CALL('[manager] analyse', this.counter, amplitudes);
        TdLibController.clientUpdate({
            '@type': 'clientUpdateGroupCallAmplitude',
            amplitudes
        });
    }
}