/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from './EventEmitter';
import TdLibController from '../Controllers/TdLibController';
import { isValidPoll } from '../Utils/Poll';

class PollStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.poll = null;
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                const { authorization_state } = update;
                if (!authorization_state) break;

                switch (authorization_state['@type']) {
                    case 'authorizationStateClosed': {
                        this.reset();
                        break;
                    }
                }

                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateClosePollResults': {
                this.emit('clientUpdateClosePollResults', update);
                break;
            }
            case 'clientUpdateNewPoll': {
                this.set({
                    type: {
                        '@type': 'pollTypeRegular',
                        allow_multiple_answers: false
                    },
                    id: Date.now(),
                    question: '',
                    options: [],
                    is_anonymous: true
                });

                this.emit('clientUpdateNewPoll', update);
                break;
            }
            case 'clientUpdatePollChangeAnonymous': {
                const { poll } = this;
                const isAnonymous = poll && poll.is_anonymous;

                this.assign(this.poll, { is_anonymous: !isAnonymous });

                this.emit('clientUpdatePollChangeAnonymous', update);
                break;
            }
            case 'clientUpdatePollChangeAllowMultipleAnswers': {
                const { poll } = this;
                const { type } = poll;
                if (type['@type'] === 'pollTypeRegular') {
                    const allowMultipleAnswers = poll && poll.type.allow_multiple_answers;

                    const newType = { ...type, allow_multiple_answers: !allowMultipleAnswers };

                    this.assign(this.poll, { type: newType });
                }

                this.emit('clientUpdatePollChangeAllowMultipleAnswers', update);
                break;
            }
            case 'clientUpdatePollChangeType': {
                const { poll } = this;
                const { type } = poll;
                if (type['@type'] === 'pollTypeRegular') {
                    const newType = { '@type': 'pollTypeQuiz', correct_option_id: -1 };

                    this.assign(this.poll, { type: newType });
                } else {
                    const newType = { '@type': 'pollTypeRegular', allow_multiple_answers: false };

                    this.assign(this.poll, { type: newType });
                }

                this.emit('clientUpdatePollChangeType', update);
                break;
            }
            case 'clientUpdatePollChooseOption': {
                const { id } = update;
                const { options } = this.poll;

                this.assign(this.poll, {
                    options: options.map(x => (x.id === id ? { ...x, is_chosen: true } : { ...x, is_chosen: false }))
                });

                this.emit('clientUpdatePollChooseOption', update);
                break;
            }
            case 'clientUpdatePollQuestion': {
                const { question } = update;

                this.assign(this.poll, { question });

                this.emit('clientUpdatePollQuestion', update);
                break;
            }
            case 'clientUpdatePollOption': {
                const { id, text } = update;
                const { options } = this.poll;

                this.assign(this.poll, { options: options.map(x => (x.id === id ? { ...x, text } : { ...x })) });

                this.emit('clientUpdatePollOption', update);
                break;
            }
            case 'clientUpdateNewPollOption': {
                const { option } = update;
                const { options } = this.poll;

                this.assign(this.poll, { options: [...options, option] });
                this.emit('clientUpdateNewPollOption', update);
                break;
            }
            case 'clientUpdateDeletePollOption': {
                const { id } = update;
                const { options } = this.poll;

                this.assign(this.poll, { options: options.filter(x => x.id !== id) });
                this.emit('clientUpdateDeletePollOption', update);
                break;
            }
            case 'clientUpdateDeletePoll': {
                this.set(null);

                this.emit('clientUpdateDeletePoll', update);
                break;
            }
            default:
                break;
        }
    };

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    assign(source1, source2) {
        this.set(Object.assign({}, source1, source2));
    }

    set(poll) {
        this.poll = poll;
    }

    getInputMessagePoll() {
        if (!this.poll) return null;
        if (!isValidPoll(this.poll)) return null;
        const { question, options, type, is_anonymous } = this.poll;

        if (type['@type'] === 'pollTypeQuiz') {
            type.correct_option_id = options.findIndex(x => x.is_chosen);

            if (type.correct_option_id === -1) {
                return null;
            }
        }

        return {
            '@type': 'inputMessagePoll',
            question,
            options: options.filter(x => Boolean(x.text)).map(x => x.text),
            is_anonymous,
            type,
            is_closed: false
        };
    }
}

const store = new PollStore();
window.poll = store;
export default store;
