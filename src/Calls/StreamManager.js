/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getAmplitude } from './Utils';
import { LOG_CALL } from '../Stores/CallStore';
import TdLibController from '../Controllers/TdLibController';

export default class StreamManager {
    constructor(interval) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.interval = interval;
        this.timer = null;

        this.items = [];
        this.inputStream = new MediaStream();
    }

    addTrack(stream, type) {
        LOG_CALL('[manager] addTrack', type, stream);

        if (!stream) return;

        const tracks = stream.getAudioTracks();
        if (!tracks.length) return;

        const track = tracks[0];
        if (!track) return;

        const { context, items, inputStream } = this;

        // add analyser
        const source = Number(stream.id.substring(6));
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

        switch (type) {
            case 'input': {
                inputStream.addTrack(track);
                break;
            }
        }

        this.changeTimer();
    }

    removeTrack(track) {
        // LOG_CALL('[manager] removeTrack', track);
        if (!track) return;

        const { items, inputStream } = this;

        const source = track.e;
        for (let i = 0; i < items.length; i++) {
            const { track: t } = items[i];
            if (t.e === source) {
                items.splice(i, 1);
                break;
            }
        }

        switch (type) {
            case 'input': {
                inputStream.removeTrack(track);
                break;
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
        const amplitudes = items.map(x => this.getAmplitude(x));

        // LOG_CALL('[manager] analyse', amplitudes);
        TdLibController.clientUpdate({
            '@type': 'clientUpdateGroupCallAmplitude',
            amplitudes
        });
    }
}