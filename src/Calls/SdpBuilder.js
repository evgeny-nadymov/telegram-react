/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

function toAudioSsrc(ssrc) {
    if (ssrc.isMain) {
        return "0";
    }
    return `audio${ssrc.ssrc}`;
}

export class SdpBuilder {
    #lines = [];
    #newLine = [];

    add(line) {
        this.#lines.push(line);
        return this;
    }
    push(word) {
        this.#newLine.push(word);
        return this;
    }
    addJoined(separator = "") {
        this.add(this.#newLine.join(separator));
        this.#newLine = [];
        return this;
    }

    get lines() {
        return this.#lines;
    }

    join() {
        return this.#lines.join("\n");
    }

    finalize() {
        return this.join() + "\n";
    }

    addCandidate(c) {
        this.push("a=candidate:");
        this.push(
            `${c.foundation} ${c.component} ${c.protocol} ${c.priority} ${c.ip} ${c.port} typ ${c.type}`
        );
        if ("rel-addr" in c) {
            this.push(` raddr ${c["rel-addr"]} rport ${c["rel-port"]}`);
        }
        this.push(` generation ${c.generation}`);
        this.addJoined();
        return this;
    }

    addHeader(sessionId, transport, ssrcs) {
        this.add("v=0"); // version
        this.add(`o=- ${sessionId} 2 IN IP4 0.0.0.0`); // sessionId, 2=sessionVersion
        this.add("s=-"); // name of the session
        // this.add("c=IN IP4 0.0.0.0");
        this.add("t=0 0"); // time when session is valid
        this.add(`a=group:BUNDLE ${ssrcs.map(toAudioSsrc).join(" ")}`);
        this.add("a=ice-lite"); // ice-lite: is a minimal version of the ICE specification, intended for servers running on a public IP address.
        // this.add(`a=ice-ufrag:${transport.ufrag}`);
        // this.add(`a=ice-pwd:${transport.pwd}`);
        // for (let fingerprint of transport.fingerprints) {
        //     this.add(`a=fingerprint:${fingerprint.hash} ${fingerprint.fingerprint}`);
        //     //this.add(`a=setup:${fingerprint.setup}`);
        //     this.add(`a=setup:passive`);
        // }

        return this;
    }

    addTransport(transport) {
        this.add(`a=ice-ufrag:${transport.ufrag}`);
        this.add(`a=ice-pwd:${transport.pwd}`);
        for (let fingerprint of transport.fingerprints) {
            this.add(`a=fingerprint:${fingerprint.hash} ${fingerprint.fingerprint}`);
            //this.add(`a=setup:${fingerprint.setup}`);
            this.add(`a=setup:passive`);
        }
        const { candidates } = transport;
        for (let candidate of candidates) {
            this.addCandidate(candidate);
        }
        return this;
    }

    addSsrcEntry(entry, transport, isAnswer) {
        let add = (x) => this.add(x);
        let ssrc = entry.ssrc;
        // TODO: port = 0 or 1
        add(`m=audio ${entry.isMain ? 1 : 0} RTP/SAVPF 111 126`);
        if (true || entry.isMain) {
            add("c=IN IP4 0.0.0.0");
        }
        add(`a=mid:${toAudioSsrc(entry)}`);
        if (entry.isRemoved) {
            add("a=inactive");
            return;
        }

        if (true || entry.isMain) {
            this.addTransport(transport);
        }

        add("a=rtpmap:111 opus/48000/2");
        add("a=rtpmap:126 telephone-event/8000");
        add("a=fmtp:111 minptime=10; useinbandfec=1; usedtx=1");
        add("a=rtcp:1 IN IP4 0.0.0.0");
        add("a=rtcp-mux");
        add("a=rtcp-fb:111 transport-cc");
        add("a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level");
        // add(
        //     "a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time"
        // );
        // add(
        //     "a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01"
        // );
        if (isAnswer) {
            add("a=recvonly");
            return this;
        }
        if (entry.isMain) {
            add("a=sendrecv");
        } else {
            add("a=sendonly");
            add("a=bundle-only");
        }
        add(`a=ssrc-group:FID ${ssrc}`);
        add(`a=ssrc:${ssrc} cname:stream${ssrc}`);
        add(`a=ssrc:${ssrc} msid:stream${ssrc} audio${ssrc}`);
        add(`a=ssrc:${ssrc} mslabel:audio${ssrc}`);
        add(`a=ssrc:${ssrc} label:audio${ssrc}`);
        return this;
    }

    addConference(conference, isAnswer = false) {
        let ssrcs = conference.ssrcs;
        if (isAnswer) {
            for (let ssrc of ssrcs) {
                if (ssrc.isMain) {
                    ssrcs = [ssrc];
                    break;
                }
            }
        }

        this.addHeader(conference.sessionId, conference.transport, ssrcs);
        for (let entry of ssrcs) {
            this.addSsrcEntry(entry, conference.transport, isAnswer);
        }
        return this;
    }

    static fromConference(conference, isAnswer = false) {
        return new SdpBuilder().addConference(conference, isAnswer).finalize();
    }
}