/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getAmplitude } from './Utils';
import TdLibController from '../Controllers/TdLibController';

export default class TrackManager {
    constructor(interval) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.interval = interval;
        this.timer = null;

        this.items = [];
    }

    addTrack(stream, type) {
        if (!stream) return;

        const tracks = stream.getAudioTracks();
        if (!tracks.length) return;

        const track = tracks[0];
        if (!track) return;

        const { context, items } = this;

        // add analyser
        const source = Number(track.id.substring(6));
        const streamSource = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();

        track.e = source;
        track.onended = () => {
            this.removeTrack(track);
        };

        analyser.minDecibels = -100;
        analyser.maxDecibels = -30;
        analyser.smoothingTimeConstant = 0.05;
        analyser.fftSize = 1024;

        // connect Web Audio API
        streamSource.connect(analyser);
        analyser.connect(context.destination);

        this.removeTrack(track);
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
        if (!track) return;

        const source = Number(track.id.substring(6));
        for (let i = 0; i < items.length; i++) {
            const { track: t } = items[i];
            if (t.e === source) {
                items.splice(i, 1);
                break;
            }
        }

        this.changeTimer();
    }

    changeTimer() {
        const { timer, items, interval } = this;

        clearInterval(timer);
        if (items.length > 0) {
            this.timer = setInterval(this.analyse, interval);
        }
    }

    getAmplitude(item) {
        const { analyser, stream, track, source } = item;
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
        const amplitudes = items.map(x => this.getAmplitude(x));

        TdLibController.clientUpdate({
            '@type': 'clientUpdateGroupCallAmplitude',
            amplitudes
        });
    }
}