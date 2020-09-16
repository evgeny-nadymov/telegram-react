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

    onClientUpdateMonkeyIdle = update => {
        const { idleData } = this.state;

        this.setState(
            {
                fileId: 'idle',
                data: idleData,
                lastUpdate: update
            },
            () => {
                const { current } = this.lottieRef;
                if (!current) return;

                current.playSegments([0, 179], true);
            }
        );
    };

    onClientUpdateMonkeyTracking = update => {
        const { code, prevCode } = update;
        const { trackingData } = this.state;

        const from = Math.min(20 * prevCode.length, 179);
        const to = Math.min(20 * code.length, 179);

        if (from === 179 && to === 179) {
            return;
        }

        this.setState(
            {
                fileId: 'tracking',
                data: trackingData,
                lastUpdate: update
            },
            () => {
                const { current } = this.lottieRef;
                if (!current) return;

                current.playSegments([from, to], true);
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
                const { current } = this.lottieRef;
                if (!current) return;

                current.playSegments([0, 49], true);
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
                const { current } = this.lottieRef;
                if (!current) return;

                if (peek) {
                    current.playSegments([0, 15], true);
                } else {
                    current.playSegments([15, 33], true);
                }
            }
        );
    };

    render() {
        const { state } = this.props;
        const { fileId, data } = this.state;

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
                                        stringData: data,
                                        renderer: 'svg',
                                        rendererSettings: {
                                            preserveAspectRatio: 'xMinYMin slice', // Supports the same options as the svg element's preserveAspectRatio property
                                            clearCanvas: false,
                                            progressiveLoad: true, // Boolean, only svg renderer, loads dom elements when needed. Might speed up initialization for large number of elements.
                                            hideOnTransparent: true, //Boolean, only svg renderer, hides elements when opacity reaches 0 (defaults to true)
                                            className: 'auth-caption-lottie'
                                        }
                                    }}
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
