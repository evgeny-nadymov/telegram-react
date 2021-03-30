/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class FirefoxP2PSdpBuilder {
    static generateOffer(info) {
        const { sessionId, hash, fingerprint, media } = info;
        let sdp = `v=0
o=mozilla...THIS_IS_SDPARTA-86.0.1 ${sessionId} 0 IN IP4 0.0.0.0
s=-
t=0 0`;
        if ( hash && fingerprint) {
            sdp += `
a=fingerprint:${hash} ${fingerprint}`;
        }
        sdp += `
a=group:BUNDLE ${media.map(x => x.mid).join(' ')}
a=ice-options:trickle
a=msid-semantic:WMS *`;
        const streamName = 'stream' + media.map(x => x.ssrc).join('_');
        for (let i = 0; i < media.length; i++) {
            const m = media[i];
            const { type, mid, ssrc, ufrag, pwd, hash, fingerprint, setup, dir } = m;
            switch (type) {
                case 'audio': {
                    sdp += `
m=audio 9 UDP/TLS/RTP/SAVPF 109 9 0 8 101
c=IN IP4 0.0.0.0`;
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    sdp += `
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1
a=fmtp:101 0-15
a=ice-pwd:${pwd}
a=ice-ufrag:${ufrag}
a=mid:${mid}
a=rtcp-mux
a=rtpmap:109 opus/48000/2
a=rtpmap:9 G722/8000/1
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000/1
a=setup:${setup}`;
                    if (ssrc) {
                        sdp += `
a=ssrc:${ssrc} cname:${streamName}`;
                    }

                    break;
                }
                case 'video': {
                    sdp += `
m=video 9 UDP/TLS/RTP/SAVPF 120 124 121 125 126 127 97 98
c=IN IP4 0.0.0.0`;
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    sdp += `
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset
a=extmap:6/recvonly http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:7 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
a=fmtp:120 max-fs=12288;max-fr=60
a=fmtp:124 apt=120
a=fmtp:121 max-fs=12288;max-fr=60
a=fmtp:125 apt=121
a=fmtp:127 apt=126
a=fmtp:98 apt=97
a=ice-pwd:${pwd}
a=ice-ufrag:${ufrag}
a=mid:${mid}
a=rtcp-fb:120 nack
a=rtcp-fb:120 nack pli
a=rtcp-fb:120 ccm fir
a=rtcp-fb:120 goog-remb
a=rtcp-fb:120 transport-cc
a=rtcp-fb:121 nack
a=rtcp-fb:121 nack pli
a=rtcp-fb:121 ccm fir
a=rtcp-fb:121 goog-remb
a=rtcp-fb:121 transport-cc
a=rtcp-fb:126 nack
a=rtcp-fb:126 nack pli
a=rtcp-fb:126 ccm fir
a=rtcp-fb:126 goog-remb
a=rtcp-fb:126 transport-cc
a=rtcp-fb:97 nack
a=rtcp-fb:97 nack pli
a=rtcp-fb:97 ccm fir
a=rtcp-fb:97 goog-remb
a=rtcp-fb:97 transport-cc
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:120 VP8/90000
a=rtpmap:124 rtx/90000
a=rtpmap:121 VP9/90000
a=rtpmap:125 rtx/90000
a=rtpmap:126 H264/90000
a=rtpmap:127 rtx/90000
a=rtpmap:97 H264/90000
a=rtpmap:98 rtx/90000
a=setup:${setup}`;
                    if (ssrc) {
                        sdp += `
a=ssrc:${ssrc} cname:${streamName}`;
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
        let sdp = `v=0
o=mozilla...THIS_IS_SDPARTA-86.0.1 ${sessionId} 0 IN IP4 0.0.0.0
s=-
t=0 0`;
        if ( hash && fingerprint) {
            sdp += `
a=fingerprint:${hash} ${fingerprint}`;
        }
        sdp += `
a=group:BUNDLE ${media.map(x => x.mid).join(' ')}
a=ice-options:trickle
a=msid-semantic:WMS *`;
        const streamName = 'stream' + media.map(x => x.ssrc).join('_');
        for (let i = 0; i < media.length; i++) {
            const m = media[i];
            const { type, mid, ssrc, ufrag, pwd, hash, fingerprint, setup, dir } = m;
            switch (type) {
                case 'audio': {
                    sdp += `
m=audio 9 UDP/TLS/RTP/SAVPF 109 9 0 8 101
c=IN IP4 0.0.0.0`;
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    sdp += `
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1
a=fmtp:101 0-15
a=ice-pwd:${pwd}
a=ice-ufrag:${ufrag}
a=mid:${mid}
a=rtcp-mux
a=rtpmap:109 opus/48000/2
a=rtpmap:9 G722/8000/1
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000/1
a=setup:${setup}`;
                    if (ssrc) {
                        sdp += `
a=ssrc:${ssrc} cname:${streamName}`;
                    }

                    break;
                }
                case 'video': {
                    sdp += `
m=video 9 UDP/TLS/RTP/SAVPF 120 124 121 125 126 127 97 98
c=IN IP4 0.0.0.0`;
                    if (dir) {
                        sdp += `
a=${dir}`;
                    }
                    sdp += `
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset
a=extmap:6/recvonly http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:7 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
a=fmtp:120 max-fs=12288;max-fr=60
a=fmtp:124 apt=120
a=fmtp:121 max-fs=12288;max-fr=60
a=fmtp:125 apt=121
a=fmtp:127 apt=126
a=fmtp:98 apt=97
a=ice-pwd:${pwd}
a=ice-ufrag:${ufrag}
a=mid:${mid}
a=rtcp-fb:120 nack
a=rtcp-fb:120 nack pli
a=rtcp-fb:120 ccm fir
a=rtcp-fb:120 goog-remb
a=rtcp-fb:120 transport-cc
a=rtcp-fb:121 nack
a=rtcp-fb:121 nack pli
a=rtcp-fb:121 ccm fir
a=rtcp-fb:121 goog-remb
a=rtcp-fb:121 transport-cc
a=rtcp-fb:126 nack
a=rtcp-fb:126 nack pli
a=rtcp-fb:126 ccm fir
a=rtcp-fb:126 goog-remb
a=rtcp-fb:126 transport-cc
a=rtcp-fb:97 nack
a=rtcp-fb:97 nack pli
a=rtcp-fb:97 ccm fir
a=rtcp-fb:97 goog-remb
a=rtcp-fb:97 transport-cc
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:120 VP8/90000
a=rtpmap:124 rtx/90000
a=rtpmap:121 VP9/90000
a=rtpmap:125 rtx/90000
a=rtpmap:126 H264/90000
a=rtpmap:127 rtx/90000
a=rtpmap:97 H264/90000
a=rtpmap:98 rtx/90000
a=setup:${setup}`;
                    if (ssrc) {
                        sdp += `
a=ssrc:${ssrc} cname:${streamName}`;
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