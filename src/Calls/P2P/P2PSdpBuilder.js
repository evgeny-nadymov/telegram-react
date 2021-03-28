/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChromeP2PSdpBuilder } from './ChromeP2PSdpBuilder';
import { FirefoxP2PSdpBuilder } from './FirefoxP2PSdpBuilder';
import { SafariP2PSdpBuilder } from './SafariP2PSdpBuilder';

export function p2pParseSdp(sdp) {
    const lines = sdp.split('\r\n');
    const lookup = (prefix, force = true, lineFrom = 0, lineTo = Number.MAX_VALUE) => {
        if (lineTo === -1) {
            lineTo = Number.MAX_VALUE;
        }
        for (let i = lineFrom; i < lines.length && i < lineTo; i++) {
            const line = lines[i];
            if (line.startsWith(prefix)) {
                return line.substr(prefix.length);
            }
        }

        if (force) {
            console.error("Can't find prefix", prefix);
        }

        return null;
    };
    const findIndex = (prefix, lineFrom = 0, lineTo = Number.MAX_VALUE) => {
        if (lineTo === -1) {
            lineTo = Number.MAX_VALUE;
        }
        for (let i = lineFrom; i < lines.length && i < lineTo; i++) {
            const line = lines[i];
            if (line.startsWith(prefix)) {
                return i;
            }
        }

        return -1;
    };
    const findDirection = (lineFrom = 0, lineTo = Number.MAX_VALUE) => {
        if (lineTo === -1) {
            lineTo = Number.MAX_VALUE;
        }
        for (let i = lineFrom; i < lines.length && i < lineTo; i++) {
            const line = lines[i];
            if (line.startsWith('a=sendonly')) {
                return 'sendonly';
            } else if (line.startsWith('a=recvonly')) {
                return 'recvonly';
            } else if (line.startsWith('a=sendrecv')) {
                return 'sendrecv';
            } else if (line.startsWith('a=inactive')) {
                return 'inactive';
            }
        }

        return '';
    }

    const pwdIndex = findIndex('a=ice-pwd:');
    const ufragIndex = findIndex('a=ice-ufrag:');
    if (pwdIndex === -1 && ufragIndex === -1) {
        return {
            sessionId: lookup('o=').split(' ')[1],
            hash: null,
            fingerprint: null,
            media: []
        };
    }

    const info = {
        sessionId: lookup('o=').split(' ')[1],
        hash: null,
        fingerprint: null,
        media: []
    };

    let mediaIndex = findIndex('m=');
    let fingerprint = lookup('a=fingerprint:', false, 0, mediaIndex);
    if (fingerprint) {
        info.hash = fingerprint.split(' ')[0];
        info.fingerprint = fingerprint.split(' ')[1];
    }

    while (mediaIndex !== -1) {
        let nextMediaIndex = findIndex('m=', mediaIndex + 1);
        const media = {
            type: lookup('m=', true, mediaIndex, nextMediaIndex).split(' ')[0],
            mid: lookup('a=mid:', true, mediaIndex, nextMediaIndex),
            setup: lookup('a=setup:', true, mediaIndex, nextMediaIndex),
            dir: findDirection(mediaIndex, nextMediaIndex),
            pwd: lookup('a=ice-pwd:', true, mediaIndex, nextMediaIndex),
            ufrag: lookup('a=ice-ufrag:', true, mediaIndex, nextMediaIndex),
        }
        let fingerprint = lookup('a=fingerprint:', false, mediaIndex, nextMediaIndex);
        if (fingerprint) {
            media.hash = fingerprint.split(' ')[0];
            media.fingerprint = fingerprint.split(' ')[1];
        }
        const ssrc = lookup('a=ssrc:', false, mediaIndex, nextMediaIndex);
        if (ssrc) {
            media.ssrc = parseInt(ssrc.split(' ')[0]);
        }

        info.media.push(media);

        mediaIndex = nextMediaIndex;
    }

    // console.log('[p2pParseSdp]', sdp, info);
    return info;
}


function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

function isSafari() {
    return navigator.userAgent.toLowerCase().indexOf('safari') > -1 && navigator.userAgent.toLowerCase().indexOf('chrome') === -1;
}

export class P2PSdpBuilder {
    static generateOffer(info) {
        if (isFirefox()) {
            return FirefoxP2PSdpBuilder.generateOffer(info);
        } else if (isSafari()) {
            return SafariP2PSdpBuilder.generateOffer(info);
        }

        return ChromeP2PSdpBuilder.generateOffer(info);
    }

    static generateAnswer(info) {
        if (isFirefox()) {
            return FirefoxP2PSdpBuilder.generateAnswer(info);
        } else if (isSafari()) {
            return SafariP2PSdpBuilder.generateAnswer(info);
        }

        return ChromeP2PSdpBuilder.generateAnswer(info);
    }

//     static generateOffer(info) {
//         const { source: ssrc, sessionId, fingerprint, hash, setup, pwd, ufrag } = info;
//
//         let sdp = `v=0
// o=- ${sessionId} 2 IN IP4 127.0.0.1
// s=-
// t=0 0
// a=group:BUNDLE 0 1
// a=extmap-allow-mixed
// a=msid-semantic: WMS
// m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126
// c=IN IP4 0.0.0.0
// a=rtcp:9 IN IP4 0.0.0.0
// a=ice-ufrag:${ufrag}
// a=ice-pwd:${pwd}
// a=ice-options:trickle
// a=fingerprint:${hash} ${fingerprint}
// a=setup:${setup}
// a=mid:0
// a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
// a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
// a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
// a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
// a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
// a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
// a=recvonly
// a=rtcp-mux
// a=rtpmap:111 opus/48000/2
// a=rtcp-fb:111 transport-cc
// a=fmtp:111 minptime=10;useinbandfec=1
// a=rtpmap:103 ISAC/16000
// a=rtpmap:104 ISAC/32000
// a=rtpmap:9 G722/8000
// a=rtpmap:0 PCMU/8000
// a=rtpmap:8 PCMA/8000
// a=rtpmap:106 CN/32000
// a=rtpmap:105 CN/16000
// a=rtpmap:13 CN/8000
// a=rtpmap:110 telephone-event/48000
// a=rtpmap:112 telephone-event/32000
// a=rtpmap:113 telephone-event/16000
// a=rtpmap:126 telephone-event/8000
// m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 122 102 121 127 120 125 107 108 109 124 119 123 118 114 115 116 35
// c=IN IP4 0.0.0.0
// a=rtcp:9 IN IP4 0.0.0.0
// a=ice-ufrag:${ufrag}
// a=ice-pwd:${pwd}
// a=ice-options:trickle
// a=fingerprint:${hash} ${fingerprint}
// a=setup:${setup}
// a=mid:1
// a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
// a=extmap:13 urn:3gpp:video-orientation
// a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
// a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
// a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
// a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
// a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
// a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
// a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
// a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
// a=${ssrc ? 'sendrecv' : 'recvonly' }
// a=rtcp-mux
// a=rtcp-rsize
// a=rtpmap:96 VP8/90000
// a=rtcp-fb:96 goog-remb
// a=rtcp-fb:96 transport-cc
// a=rtcp-fb:96 ccm fir
// a=rtcp-fb:96 nack
// a=rtcp-fb:96 nack pli
// a=rtpmap:97 rtx/90000
// a=fmtp:97 apt=96
// a=rtpmap:98 VP9/90000
// a=rtcp-fb:98 goog-remb
// a=rtcp-fb:98 transport-cc
// a=rtcp-fb:98 ccm fir
// a=rtcp-fb:98 nack
// a=rtcp-fb:98 nack pli
// a=fmtp:98 profile-id=0
// a=rtpmap:99 rtx/90000
// a=fmtp:99 apt=98
// a=rtpmap:100 VP9/90000
// a=rtcp-fb:100 goog-remb
// a=rtcp-fb:100 transport-cc
// a=rtcp-fb:100 ccm fir
// a=rtcp-fb:100 nack
// a=rtcp-fb:100 nack pli
// a=fmtp:100 profile-id=2
// a=rtpmap:101 rtx/90000
// a=fmtp:101 apt=100
// a=rtpmap:122 VP9/90000
// a=rtcp-fb:122 goog-remb
// a=rtcp-fb:122 transport-cc
// a=rtcp-fb:122 ccm fir
// a=rtcp-fb:122 nack
// a=rtcp-fb:122 nack pli
// a=fmtp:122 profile-id=1
// a=rtpmap:102 H264/90000
// a=rtcp-fb:102 goog-remb
// a=rtcp-fb:102 transport-cc
// a=rtcp-fb:102 ccm fir
// a=rtcp-fb:102 nack
// a=rtcp-fb:102 nack pli
// a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
// a=rtpmap:121 rtx/90000
// a=fmtp:121 apt=102
// a=rtpmap:127 H264/90000
// a=rtcp-fb:127 goog-remb
// a=rtcp-fb:127 transport-cc
// a=rtcp-fb:127 ccm fir
// a=rtcp-fb:127 nack
// a=rtcp-fb:127 nack pli
// a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
// a=rtpmap:120 rtx/90000
// a=fmtp:120 apt=127
// a=rtpmap:125 H264/90000
// a=rtcp-fb:125 goog-remb
// a=rtcp-fb:125 transport-cc
// a=rtcp-fb:125 ccm fir
// a=rtcp-fb:125 nack
// a=rtcp-fb:125 nack pli
// a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
// a=rtpmap:107 rtx/90000
// a=fmtp:107 apt=125
// a=rtpmap:108 H264/90000
// a=rtcp-fb:108 goog-remb
// a=rtcp-fb:108 transport-cc
// a=rtcp-fb:108 ccm fir
// a=rtcp-fb:108 nack
// a=rtcp-fb:108 nack pli
// a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
// a=rtpmap:109 rtx/90000
// a=fmtp:109 apt=108
// a=rtpmap:124 H264/90000
// a=rtcp-fb:124 goog-remb
// a=rtcp-fb:124 transport-cc
// a=rtcp-fb:124 ccm fir
// a=rtcp-fb:124 nack
// a=rtcp-fb:124 nack pli
// a=fmtp:124 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d0032
// a=rtpmap:119 rtx/90000
// a=fmtp:119 apt=124
// a=rtpmap:123 H264/90000
// a=rtcp-fb:123 goog-remb
// a=rtcp-fb:123 transport-cc
// a=rtcp-fb:123 ccm fir
// a=rtcp-fb:123 nack
// a=rtcp-fb:123 nack pli
// a=fmtp:123 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640032
// a=rtpmap:118 rtx/90000
// a=fmtp:118 apt=123
// a=rtpmap:114 red/90000
// a=rtpmap:115 rtx/90000
// a=fmtp:115 apt=114
// a=rtpmap:116 ulpfec/90000
// a=rtpmap:35 flexfec-03/90000
// a=rtcp-fb:35 goog-remb
// a=rtcp-fb:35 transport-cc
// a=fmtp:35 repair-window=10000000`;
//         if (ssrc) {
//             sdp += `
// a=ssrc-group:FID ${ssrc}
// a=ssrc:${ssrc} cname:stream${ssrc}
// a=ssrc:${ssrc} msid:stream${ssrc} audio${ssrc}
// a=ssrc:${ssrc} mslabel:audio${ssrc}
// a=ssrc:${ssrc} label:audio${ssrc}`;
//         }
//
//         sdp += `
// `;
//
//         return sdp;
//     }

//     static generateAnswer(info) {
//         const { source: ssrc, sessionId, fingerprint, hash, setup, pwd, ufrag } = info;
//
//         let sdp = `v=0
// o=- ${sessionId} 2 IN IP4 127.0.0.1
// s=-
// t=0 0
// a=group:BUNDLE 0 1
// a=extmap-allow-mixed
// a=msid-semantic: WMS Oa0hcvxOpJbzPHflvZ3Z4FMyTipofelmR85z
// m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126
// c=IN IP4 0.0.0.0
// a=rtcp:9 IN IP4 0.0.0.0
// a=ice-ufrag:${ufrag}
// a=ice-pwd:${pwd}
// a=ice-options:trickle
// a=fingerprint:${hash} ${fingerprint}
// a=setup:${setup}
// a=mid:0
// a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
// a=inactive
// a=rtcp-mux
// a=rtpmap:111 opus/48000/2
// a=rtcp-fb:111 transport-cc
// a=fmtp:111 minptime=10;useinbandfec=1
// a=rtpmap:103 ISAC/16000
// a=rtpmap:104 ISAC/32000
// a=rtpmap:9 G722/8000
// a=rtpmap:0 PCMU/8000
// a=rtpmap:8 PCMA/8000
// a=rtpmap:106 CN/32000
// a=rtpmap:105 CN/16000
// a=rtpmap:13 CN/8000
// a=rtpmap:110 telephone-event/48000
// a=rtpmap:112 telephone-event/32000
// a=rtpmap:113 telephone-event/16000
// a=rtpmap:126 telephone-event/8000
// m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 121 127 120 125 107 108 109 124 119 123 118 114 115 116
// c=IN IP4 0.0.0.0
// a=rtcp:9 IN IP4 0.0.0.0
// a=ice-ufrag:${ufrag}
// a=ice-pwd:${pwd}
// a=ice-options:trickle
// a=fingerprint:${hash} ${fingerprint}
// a=setup:${setup}
// a=mid:1
// a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:13 urn:3gpp:video-orientation
// a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
// a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
// a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
// a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
// a=${ssrc ? 'sendrecv' : 'inactive' }
// a=rtcp-mux
// a=rtcp-rsize
// a=rtpmap:96 VP8/90000
// a=rtcp-fb:96 goog-remb
// a=rtcp-fb:96 transport-cc
// a=rtcp-fb:96 ccm fir
// a=rtcp-fb:96 nack
// a=rtcp-fb:96 nack pli
// a=rtpmap:97 rtx/90000
// a=fmtp:97 apt=96
// a=rtpmap:98 VP9/90000
// a=rtcp-fb:98 goog-remb
// a=rtcp-fb:98 transport-cc
// a=rtcp-fb:98 ccm fir
// a=rtcp-fb:98 nack
// a=rtcp-fb:98 nack pli
// a=fmtp:98 profile-id=0
// a=rtpmap:99 rtx/90000
// a=fmtp:99 apt=98
// a=rtpmap:100 VP9/90000
// a=rtcp-fb:100 goog-remb
// a=rtcp-fb:100 transport-cc
// a=rtcp-fb:100 ccm fir
// a=rtcp-fb:100 nack
// a=rtcp-fb:100 nack pli
// a=fmtp:100 profile-id=2
// a=rtpmap:101 rtx/90000
// a=fmtp:101 apt=100
// a=rtpmap:102 H264/90000
// a=rtcp-fb:102 goog-remb
// a=rtcp-fb:102 transport-cc
// a=rtcp-fb:102 ccm fir
// a=rtcp-fb:102 nack
// a=rtcp-fb:102 nack pli
// a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
// a=rtpmap:121 rtx/90000
// a=fmtp:121 apt=102
// a=rtpmap:127 H264/90000
// a=rtcp-fb:127 goog-remb
// a=rtcp-fb:127 transport-cc
// a=rtcp-fb:127 ccm fir
// a=rtcp-fb:127 nack
// a=rtcp-fb:127 nack pli
// a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
// a=rtpmap:120 rtx/90000
// a=fmtp:120 apt=127
// a=rtpmap:125 H264/90000
// a=rtcp-fb:125 goog-remb
// a=rtcp-fb:125 transport-cc
// a=rtcp-fb:125 ccm fir
// a=rtcp-fb:125 nack
// a=rtcp-fb:125 nack pli
// a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
// a=rtpmap:107 rtx/90000
// a=fmtp:107 apt=125
// a=rtpmap:108 H264/90000
// a=rtcp-fb:108 goog-remb
// a=rtcp-fb:108 transport-cc
// a=rtcp-fb:108 ccm fir
// a=rtcp-fb:108 nack
// a=rtcp-fb:108 nack pli
// a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
// a=rtpmap:109 rtx/90000
// a=fmtp:109 apt=108
// a=rtpmap:124 H264/90000
// a=rtcp-fb:124 goog-remb
// a=rtcp-fb:124 transport-cc
// a=rtcp-fb:124 ccm fir
// a=rtcp-fb:124 nack
// a=rtcp-fb:124 nack pli
// a=fmtp:124 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d0032
// a=rtpmap:119 rtx/90000
// a=fmtp:119 apt=124
// a=rtpmap:123 H264/90000
// a=rtcp-fb:123 goog-remb
// a=rtcp-fb:123 transport-cc
// a=rtcp-fb:123 ccm fir
// a=rtcp-fb:123 nack
// a=rtcp-fb:123 nack pli
// a=fmtp:123 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640032
// a=rtpmap:118 rtx/90000
// a=fmtp:118 apt=123
// a=rtpmap:114 red/90000
// a=rtpmap:115 rtx/90000
// a=fmtp:115 apt=114
// a=rtpmap:116 ulpfec/90000`;
//
//         if (ssrc) {
//             sdp += `
// a=ssrc-group:FID ${ssrc}
// a=ssrc:${ssrc} cname:stream${ssrc}
// a=ssrc:${ssrc} msid:stream${ssrc} audio${ssrc}
// a=ssrc:${ssrc} mslabel:audio${ssrc}
// a=ssrc:${ssrc} label:audio${ssrc}`;
//         }
//
//         sdp += `
// `;
//
//         return sdp;
//     }
}