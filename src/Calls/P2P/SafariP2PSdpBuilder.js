/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class SafariP2PSdpBuilder {
    static generateOffer(info) {
        const { sessionId, hash, fingerprint, media } = info;
        if (!media.length) {
            return `v=0
o=- ${sessionId} 2 IN IP4 127.0.0.1
s=-
t=0 0
a=msid-semantic: WMS
`;
        }

        let sdp = `v=0
o=- ${sessionId} 2 IN IP4 127.0.0.1
s=-
t=0 0`;
        if (hash && fingerprint) {
            sdp += `
a=fingerprint:${hash} ${fingerprint}`;
        }
        sdp += `
a=group:BUNDLE ${media.map(x => x.mid).join(' ')}
a=extmap-allow-mixed
a=msid-semantic: WMS *`;
        const streamName = 'stream' + media.map(x => x.ssrc).join('_');
        for (let i = 0; i < media.length; i++) {
            const m = media[i];
            const {type, ssrc, ufrag, pwd, hash, fingerprint, setup, dir, mid} = m;
            switch (type) {
                case 'audio': {
                    sdp += `
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 9 102 0 8 105 13 110 113 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${ufrag}
a=ice-pwd:${pwd}
a=ice-options:trickle
a=fingerprint:${hash} ${fingerprint}
a=setup:${setup}
a=mid:${mid}
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id`
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    if (ssrc) {
                        sdp += `
a=msid:${streamName} audio${ssrc}`;
                    }
                    sdp += `
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:103 ISAC/16000
a=rtpmap:9 G722/8000
a=rtpmap:102 ILBC/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000`;
                    if (ssrc) {
                        sdp += `
a=ssrc-group:FID ${ssrc}
a=ssrc:${ssrc} cname:stream${ssrc}
a=ssrc:${ssrc} msid:${streamName} audio${ssrc}
a=ssrc:${ssrc} mslabel:audio${ssrc}
a=ssrc:${ssrc} label:audio${ssrc}`;
                    }

                    break;
                }
                case 'video': {
                    sdp += `
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${ufrag}
a=ice-pwd:${pwd}
a=ice-options:trickle
a=fingerprint:${hash} ${fingerprint}
a=setup:${setup}
a=mid:${mid}
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:13 urn:3gpp:video-orientation
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id`
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    if (ssrc) {
                        sdp += `
a=msid:${streamName} video${ssrc}`;
                    }
                    sdp += `
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 H264/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP8/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:127 red/90000
a=rtpmap:125 rtx/90000
a=fmtp:125 apt=127
a=rtpmap:104 ulpfec/90000`;
                    if (ssrc) {
                        sdp += `
a=ssrc-group:FID ${ssrc}
a=ssrc:${ssrc} cname:stream${ssrc}
a=ssrc:${ssrc} msid:${streamName} video${ssrc}
a=ssrc:${ssrc} mslabel:video${ssrc}
a=ssrc:${ssrc} label:video${ssrc}`;
                    }
                    break;
                }
            }
        }

        sdp += `
`;

        return sdp;
    }

    static generateAnswer(info) {
        const { sessionId, hash, fingerprint, media } = info;
        if (!media.length) {
            return `v=0
o=- ${sessionId} 2 IN IP4 127.0.0.1
s=-
t=0 0
a=msid-semantic: WMS
`;
        }

        let sdp = `v=0
o=- ${sessionId} 2 IN IP4 127.0.0.1
s=-
t=0 0`;
        if (hash && fingerprint) {
            sdp += `
a=fingerprint:${hash} ${fingerprint}`;
        }
        sdp += `
a=group:BUNDLE ${media.map(x => x.mid).join(' ')}
a=extmap-allow-mixed
a=msid-semantic: WMS *`;
        const streamName = 'stream' + media.map(x => x.ssrc).join('_');
        for (let i = 0; i < media.length; i++) {
            const m = media[i];
            const {type, ssrc, ufrag, pwd, hash, fingerprint, setup, dir, mid} = m;
            switch (type) {
                case 'audio': {
                    sdp += `
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 9 102 0 8 105 13 110 113 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${ufrag}
a=ice-pwd:${pwd}
a=ice-options:trickle
a=fingerprint:${hash} ${fingerprint}
a=setup:${setup}
a=mid:${mid}
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id`
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    if (ssrc) {
                        sdp += `
a=msid:${streamName} audio${ssrc}`;
                    }
                    sdp += `
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:103 ISAC/16000
a=rtpmap:9 G722/8000
a=rtpmap:102 ILBC/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000`;
                    if (ssrc) {
                        sdp += `
a=ssrc-group:FID ${ssrc}
a=ssrc:${ssrc} cname:stream${ssrc}
a=ssrc:${ssrc} msid:${streamName} audio${ssrc}
a=ssrc:${ssrc} mslabel:audio${ssrc}
a=ssrc:${ssrc} label:audio${ssrc}`;
                    }

                    break;
                }
                case 'video': {
                    sdp += `
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${ufrag}
a=ice-pwd:${pwd}
a=ice-options:trickle
a=fingerprint:${hash} ${fingerprint}
a=setup:${setup}
a=mid:${mid}
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:13 urn:3gpp:video-orientation
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id`
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    if (ssrc) {
                        sdp += `
a=msid:${streamName} video${ssrc}`;
                    }
                    sdp += `
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 H264/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP8/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:127 red/90000
a=rtpmap:125 rtx/90000
a=fmtp:125 apt=127
a=rtpmap:104 ulpfec/90000`;
                    if (ssrc) {
                        sdp += `
a=ssrc-group:FID ${ssrc}
a=ssrc:${ssrc} cname:stream${ssrc}
a=ssrc:${ssrc} msid:${streamName} video${ssrc}
a=ssrc:${ssrc} mslabel:video${ssrc}
a=ssrc:${ssrc} label:video${ssrc}`;
                    }
                    break;
                }
            }
        }

        sdp += `
`;

        return sdp;
    }
}