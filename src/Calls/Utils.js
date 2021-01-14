/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// changes ssrcs
import { LOG_CALL } from '../Stores/CallStore';

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