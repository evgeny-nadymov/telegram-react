/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SdpBuilder } from './SdpBuilder';
import { mergeSsrcs } from './Utils';

export default class LocalConferenceDescription {
    #sessionId;
    #transport;
    #ssrcs = [];

    onSsrcs;

    constructor() {
        this.#sessionId = Date.now();
    }

    updateFromServer(data) {
        if (data.transport) {
            this.#transport = data.transport;
        }
        if (mergeSsrcs(this.#ssrcs, data.ssrcs) && this.onSsrcs) {
            this.onSsrcs(this.#ssrcs);
        }
    }

    generateSdp(isAnswer = false) {
        return SdpBuilder.fromConference(
            {
                sessionId: this.#sessionId,
                transport: this.#transport,
                ssrcs: this.#ssrcs
            },
            isAnswer
        );
    }
}