/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from './EventEmitter';
import TdLibController from '../Controllers/TdLibController';

class AnimationStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.savedAnimations = null;
        this.animationsInView = null;
    };

    onUpdate = async update => {
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
            case 'updateSavedAnimations': {
                this.savedAnimations = await TdLibController.send({
                    '@type': 'getSavedAnimations'
                })

                this.emit('updateSavedAnimations', update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateAnimationSend': {
                this.emit('clientUpdateAnimationSend', update);
                break;
            }
            case 'clientUpdateAnimationsInView': {
                this.animationsInView = update.animations;
                this.emit('clientUpdateAnimationsInView', update);
                break;
            }
            case 'clientUpdateAnimationPreview': {
                this.emit('clientUpdateAnimationPreview', update);
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
}

const store = new AnimationStore();
window.animation = store;
export default store;
