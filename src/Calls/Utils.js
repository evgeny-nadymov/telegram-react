/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// changes ssrcs
import CallStore, { LOG_CALL } from '../Stores/CallStore';
import LStore from '../Stores/LocalizationStore';

export function p2pIsCallReady(callId) {
    const call = CallStore.p2pGet(callId);
    if (!call) return false;

    const { state } = call;
    if (!state) return false;

    return state && state['@type'] === 'callStateReady';
}

export function p2pGetCallStatus(callId) {
    const call = CallStore.p2pGet(callId);
    if (!call) return '';

    const { state } = call;
    if (!state) return '';

    switch (state['@type']) {
        case 'callStateDiscarded': {
            return '';
        }
        case 'callStateError': {
            return '';
        }
        case 'callStateExchangingKeys': {
            return LStore.getString('VoipExchangingKeys');
        }
        case 'callStateHangingUp': {
            return '';
        }
        case 'callStatePending': {
            return '';
        }
        case 'callStateReady': {
            return getCallEmojis(callId);
        }
    }

    return '';
}

export function getCallEmojis(callId) {
    const call = CallStore.p2pGet(callId);
    if (!call) return '';

    const { state } = call;
    if (!state) return '';

    return state.emojis ? state.emojis.join('') : '';
}

export function getTransport(joinResponse) {
    const { payload, candidates } = joinResponse;

    const { ufrag, pwd, fingerprints } = payload;

    return {
        ufrag,
        pwd,
        fingerprints,
        candidates
    };
}

export function mergeSsrcs(ssrcs, newSsrcs) {
    let res = false;
    let has = (ssrcs, needle) => {
        for (let entry of ssrcs) {
            if (entry.ssrc === needle.ssrc) {
                return true;
            }
        }
        return false;
    };

    // remove old ssrcs
    for (let ssrc of ssrcs) {
        if (!ssrc.isRemoved && !has(newSsrcs, ssrc)) {
            console.log(`ssrc REMOVE ${ssrc.name} ${ssrc.ssrc}`, ssrc);
            ssrc.isRemoved = true;
            res = true;
        }
    }

    // add Main ssrc
    for (let ssrc of newSsrcs) {
        if (ssrc.isMain && !has(ssrcs, ssrc)) {
            console.log(`ssrc ADD ${ssrc.name} ${ssrc.ssrc}`, ssrc);
            ssrcs.push(ssrc);
            res = true;
        }
    }

    // add new ssrc
    for (let ssrc of newSsrcs) {
        if (!has(ssrcs, ssrc)) {
            console.log(`ssrc ADD ${ssrc.name} ${ssrc.ssrc}`, ssrc);
            ssrcs.push(ssrc);
            res = true;
        }
    }
    return res;
}

export function parseSdp(sdp) {
    let lines = sdp.split("\r\n");
    let lookup = (prefix, force = true) => {
        for (let line of lines) {
            if (line.startsWith(prefix)) {
                return line.substr(prefix.length);
            }
        }
        if (force) {
            console.error("Can't find prefix", prefix);
        }
        return null;
    };

    let info = {
        // transport
        fingerprint: lookup("a=fingerprint:").split(" ")[1],
        hash: lookup("a=fingerprint:").split(" ")[0],
        setup: lookup("a=setup:"),
        pwd: lookup("a=ice-pwd:"),
        ufrag: lookup("a=ice-ufrag:"),
    };
    let rawSource = lookup("a=ssrc:", false);
    if (rawSource) {
        info.source = parseInt(rawSource.split(" ")[0]);
    }
    return info;
}

export async function getStream(constraints, muted) {
    const stream = await navigator.mediaDevices.getUserMedia (constraints);
    stream.getTracks().forEach(x => {
        x.onmute = x => {
            LOG_CALL('track.onmute', x);
        };
        x.onunmute = x => {
            LOG_CALL('track.onunmute', x);
        };

        x.enabled = !muted;
    });

    LOG_CALL('getStream result', stream);
    return stream;
}

/// NOTE: telegram returns sign source, while webrtc uses unsign source internally
/// unsign => sign
export function toTelegramSource(source) {
    return source << 0;
}

/// NOTE: telegram returns sign source, while webrtc uses unsign source internally
/// sign => unsign
export function fromTelegramSource(source) {
    return source >>> 0;
}

export function getCallStatus(call) {
    let connected = false;
    let status = '';
    if (call) {
        const { groupCallId, connection } = call;
        const groupCall = CallStore.get(groupCallId);
        if (groupCall) {
            if (!groupCall.can_unmute_self) {
                status = 'forceMuted';
            } else {
                status = !CallStore.isMuted() ? 'unmuted' : 'muted';
            }
        }
        connected = connection && connection.iceConnectionState !== 'new' && connection.iceConnectionState !== 'connecting' && connection.iceConnectionState !== 'checking';
    }

    return { connected, status };
}

export function getAmplitude(array, scale = 3) {
    if (!array) return 0;

    const { length } = array;
    let total = 0;
    for (let i = 0; i < length; i++) {
        total += array[i] * array[i];
    }
    const rms = Math.sqrt(total / length) / 255;

    return Math.min(1, rms * scale);
}