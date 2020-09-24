/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ReactComponent as Logo } from '../../Assets/telegram-logo.svg';
import AuthStore from '../../Stores/AuthorizationStore';
import './Caption.css';

const RLottie = React.lazy(() => import('../Viewer/RLottie'));

class Caption extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            fileId: null,
            data: null,
            lastUpdate: null
        };

        this.lottieRef = React.createRef();
    }

    loadData = async () => {
        const { closeData } = this.state;
        if (closeData) return;

        try {
            const requests = [
                fetch('data/TwoFactorSetupMonkeyClose.json'),
                fetch('data/TwoFactorSetupMonkeyIdle.json'),
                fetch('data/TwoFactorSetupMonkeyPeek.json'),
                fetch('data/TwoFactorSetupMonkeyTracking.json')
            ];

            const results = await Promise.all(requests);

            const [closeData, idleData, peekData, trackingData] = await Promise.all(results.map(x => x.text()));

            this.setState(
                {
                    closeData,
                    idleData,
                    peekData,
                    trackingData
                },
                () => {
                    const { lastUpdate } = this.state;
                    if (lastUpdate) {
                        switch (lastUpdate['@type']) {
                            case 'clientUpdateMonkeyIdle': {
                                this.onClientUpdateMonkeyIdle(lastUpdate);
                                break;
                            }
                            case 'clientUpdateMonkeyTracking': {
                                this.onClientUpdateMonkeyTracking(lastUpdate);
                                break;
                            }
                            case 'clientUpdateMonkeyClose': {
                                this.onClientUpdateMonkeyClose(lastUpdate);
                                break;
                            }
                            case 'clientUpdateMonkeyPeek': {
                                this.onClientUpdateMonkeyPeek(lastUpdate);
                                break;
                            }
                        }
                    }
                }
            );
        } catch (error) {
            console.error(error);
        }
    };

    async componentDidMount() {
        setTimeout(this.loadData, 100);

        AuthStore.on('clientUpdateMonkeyIdle', this.onClientUpdateMonkeyIdle);
        AuthStore.on('clientUpdateMonkeyTracking', this.onClientUpdateMonkeyTracking);
        AuthStore.on('clientUpdateMonkeyClose', this.onClientUpdateMonkeyClose);
        AuthStore.on('clientUpdateMonkeyPeek', this.onClientUpdateMonkeyPeek);
    }

    componentWillUnmount() {
        AuthStore.off('clientUpdateMonkeyIdle', this.onClientUpdateMonkeyIdle);
        AuthStore.off('clientUpdateMonkeyTracking', this.onClientUpdateMonkeyTracking);
        AuthStore.off('clientUpdateMonkeyClose', this.onClientUpdateMonkeyClose);
        AuthStore.off('clientUpdateMonkeyPeek', this.onClientUpdateMonkeyPeek);
    }

    playSegments = (segments, forceFlag) => {
        const { current } = this.lottieRef;
        if (!current) {
            setTimeout(() => {
                const { current } = this.lottieRef;
                if (!current) return;

                current.playSegments(segments, forceFlag);
            }, 100);
            return;
        }

        current.playSegments(segments, forceFlag);
    };

    onClientUpdateMonkeyIdle = update => {
        const { idleData } = this.state;

        this.setState(
            {
                fileId: 'idle',
                data: idleData,
                lastUpdate: update
            },
            () => {
                this.playSegments([0, 179], true);
            }
        );
    };

    getFrame = (length, paddingFrames, letterFrames, framesCount) => {
        if (!length) {
            return 0;
        }

        const lastAnimatedLetter = (framesCount - 2 * paddingFrames) / letterFrames;

        let frames = paddingFrames + (length - 1) * letterFrames;
        if (length > lastAnimatedLetter + 1) {
            frames += paddingFrames;
        }

        return Math.min(frames, framesCount - 1);
    };

    onClientUpdateMonkeyTracking = update => {
        const { code, prevCode } = update;
        const { trackingData } = this.state;

        const FRAMES_COUNT = 180;
        const LETTER_FRAMES = 10;
        const PADDING_FRAMES = 20;

        const from = this.getFrame(prevCode.length, PADDING_FRAMES, LETTER_FRAMES, FRAMES_COUNT);
        const to = this.getFrame(code.length, PADDING_FRAMES, LETTER_FRAMES, FRAMES_COUNT);

        const isLastFrom = from === 0 || from === 179;
        const isLastTo = to === 0 || to === 179;

        if (isLastFrom && isLastTo) {
            return;
        }

        this.setState(
            {
                fileId: 'tracking',
                data: trackingData,
                lastUpdate: update
            },
            () => {
                this.playSegments([from, to], true);
            }
        );
    };

    onClientUpdateMonkeyClose = update => {
        const { closeData } = this.state;

        this.setState(
            {
                fileId: 'close',
                data: closeData,
                lastUpdate: update
            },
            () => {
                this.playSegments([0, 49], true);
            }
        );
    };

    onClientUpdateMonkeyPeek = update => {
        const { peek } = update;
        const { peekData, lastUpdate } = this.state;

        if (lastUpdate && lastUpdate['@type'] === 'clientUpdateMonkeyPeek' && lastUpdate.peek === peek) {
            return;
        }

        this.setState(
            {
                fileId: 'peek',
                data: peekData,
                lastUpdate: update
            },
            () => {
                if (peek) {
                    this.playSegments([0, 15], true);
                } else {
                    this.playSegments([15, 0], true);
                }
            }
        );
    };

    render() {
        const { state } = this.props;
        const { fileId, data, trackingData, closeData, peekData, idleData } = this.state;

        let control = null;
        switch (state['@type']) {
            case 'authorizationStateWaitOtherDeviceConfirmation': {
                break;
            }
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitRegistration':
            case 'authorizationStateWaitEncryptionKey':
            case 'authorizationStateWaitTdlibParameters':
            case 'authorizationStateWaitTdlib': {
                control = <Logo className='auth-caption-telegram-logo' />;
                break;
            }
            case 'authorizationStateWaitCode':
            case 'authorizationStateWaitPassword': {
                control = (
                    <div className='auth-caption-telegram-logo'>
                        { data && (
                            <React.Suspense fallback={null}>
                                <RLottie
                                    ref={this.lottieRef}
                                    options={{
                                        width: 160,
                                        height: 160,
                                        autoplay: false,
                                        loop: false,
                                        fileId,
                                        stringData: data
                                    }}
                                />
                                <RLottie
                                    options={{
                                        width: 160,
                                        height: 160,
                                        autoplay: false,
                                        loop: false,
                                        fileId: 'tracking',
                                        stringData: trackingData,
                                        queueLength: 1
                                    }}
                                    style={{ display: 'none' }}
                                />
                                <RLottie
                                    options={{
                                        width: 160,
                                        height: 160,
                                        autoplay: false,
                                        loop: false,
                                        fileId: 'close',
                                        stringData: closeData,
                                        queueLength: 1
                                    }}
                                    style={{ display: 'none' }}
                                />
                                <RLottie
                                    options={{
                                        width: 160,
                                        height: 160,
                                        autoplay: false,
                                        loop: false,
                                        fileId: 'peek',
                                        stringData: peekData,
                                        queueLength: 1
                                    }}
                                    style={{ display: 'none' }}
                                />
                                <RLottie
                                    options={{
                                        width: 160,
                                        height: 160,
                                        autoplay: false,
                                        loop: false,
                                        fileId: 'idle',
                                        stringData: idleData,
                                        queueLength: 1
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </React.Suspense>
                        )}
                    </div>
                );
                break;
            }
            default:
                control = <Logo className='auth-caption-telegram-logo' />;
                break;
        }

        return <div className='auth-caption'>{control}</div>;
    }
}

export default Caption;
