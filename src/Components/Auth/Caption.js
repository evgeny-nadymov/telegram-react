/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import classNames from 'classnames';
import { ReactComponent as Logo } from '../../Assets/telegram-logo.svg';
import Lottie from '../Viewer/Lottie';
import AuthorizationStore from '../../Stores/AuthorizationStore';
import './Caption.css';

const styles = theme => ({
    logo: {
        fill: theme.palette.primary.main
    }
});

class Caption extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};

        this.lottieRef = React.createRef();
    }

    async componentDidMount() {
        try {
            const requests = [
                fetch('json/TwoFactorSetupMonkeyClose.json'),
                fetch('json/TwoFactorSetupMonkeyIdle.json'),
                fetch('json/TwoFactorSetupMonkeyPeek.json'),
                fetch('json/TwoFactorSetupMonkeyTracking.json')
            ];

            const results = await Promise.all(requests);

            const [closeData, idleData, peekData, trackingData] = await Promise.all(results.map(x => x.json()));

            this.setState({
                closeData,
                idleData,
                peekData,
                trackingData
            });
        } catch (error) {
            console.error(error);
        }
        AuthorizationStore.on('clientUpdateCodeChange', this.onClientUpdateCodeChange);
    }

    componentWillUnmount() {
        AuthorizationStore.off('clientUpdateCodeChange', this.onClientUpdateCodeChange);
    }

    onClientUpdateCodeChange = update => {
        const lottie = this.lottieRef.current;
        if (!lottie) return;

        const { prevCode, code } = update;

        // if (prevCode.length < code.length) {
        //     lottie.pause();
        //     const from = lottie.anim.currentFrame;
        //     const from2 = lottie.getCurrentFrame();
        //     const to = code.length <= 5 ? code.length * 20 : (code.length === 0 ? 0 : 100);
        //     console.log('[an] from, to', from, from2, to, lottie.anim);
        //     lottie.playSegments([from, to], true);
        // } else {
        //     lottie.pause();
        //     const from = lottie.anim.currentRawFrame;
        //     const to = code.length <= 5 ? code.length * 20 : (code.length === 0 ? 0 : 100);
        //     console.log('[an] from, to', from, to, update);
        //     lottie.playSegments([from, to], true);
        // }
    };

    render() {
        const { classes, state } = this.props;

        let control = null;
        switch (state['@type']) {
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitEncryptionKey':
            case 'authorizationStateWaitTdlibParameters':
            case 'authorizationStateWaitTdlib': {
                control = <Logo className={classNames('auth-caption-telegram-logo', classes.logo)} />;
                break;
            }
            case 'authorizationStateWaitCode':
            case 'authorizationStateWaitPassword': {
                const animationData =
                    state['@type'] === 'authorizationStateWaitCode' ? this.state.trackingData : this.state.closeData;

                control = (
                    <div className='auth-caption-telegram-logo'>
                        <Lottie
                            ref={this.lottieRef}
                            options={{
                                autoplay: true,
                                loop: false,
                                animationData,
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
                    </div>
                );
                break;
            }
            default:
                break;
        }

        return <div className='auth-caption'>{control}</div>;
    }
}

Caption.propTypes = {};

export default withStyles(styles)(Caption);
