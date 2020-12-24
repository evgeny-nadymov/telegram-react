/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from './EventEmitter';
import TdLibController from '../Controllers/TdLibController';

class CallStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.currentGroupCall = null;
        this.items = new Map();
        this.participants = new Map();
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateChatVoiceChat': {
                const { chat_id, voice_chat_group_call_id, is_empty } = update;

                this.emit('updateChatVoiceChat', update);
                break;
            }
            case 'updateGroupCall': {
                const { group_call } = update;

                this.set(group_call);

                this.emit('updateGroupCall', update);
                break;
            }
            case 'updateGroupCallParticipant': {
                const { group_call_id, participant } = update;

                let participants = this.participants.get(group_call_id);
                if (!participants) {
                    participants = new Map();
                    this.participants.set(group_call_id, participants);
                }

                const { user_id } = participant;
                participants.set(user_id, participant);

                this.emit('updateGroupCallParticipant', update);
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

    get(callId) {
        return this.items.get(callId);
    }

    set(call) {
        this.items.set(call.id, call);
    }
}

const store = new CallStore();
window.call = store;
export default store;
