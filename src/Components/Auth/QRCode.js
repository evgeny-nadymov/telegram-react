/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import QRCodeStyling from 'qr-code-styling';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { ReactComponent as Logo } from '../../Assets/telegram-logo.svg';
import { cleanProgressStatus, isConnecting } from './Phone';
import AppStore from '../../Stores/ApplicationStore';
import './QRCode.css';

class QRCode extends React.Component {

    state = {
        connecting: false,
        showConnecting: false
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { state } = this.props;
        if (state !== prevProps.state) {
            this.loadData();
        }
    }

    componentDidMount() {
        this.loadData();
        AppStore.on('updateConnectionState', this.onUpdateConnectionState);
    }

    componentWillUnmount() {
        AppStore.off('updateConnectionState', this.onUpdateConnectionState);
    }

    loadData() {
        const { state } = this.props;

        const qrCode = new QRCodeStyling({
            width: 287,
            height: 287,
            data: state.link,
            image: '',
            dotsOptions: {
                color: 'black',
                type: 'rounded'
            },
            backgroundOptions: {
                color: 'transparent',
            }
        });

        const canvas = document.getElementById('qr-canvas');
        canvas.innerHTML = null;
        qrCode.append(canvas);
    }

    onUpdateConnectionState = update => {
        const { state } = update;

        const connecting = isConnecting(state);
        if (this.state.connecting === connecting) return;

        this.setState({ connecting, showConnecting: false });
        if (connecting) {
            setTimeout(() => {
                if (this.state.connecting) {
                    this.setState({ showConnecting: true });
                }
            }, 500);
        }
    };

    handleBack = () => {
        const { onChangePhone } = this.props;

        onChangePhone && onChangePhone();
    };

    render() {
        const { t } = this.props;
        const { showConnecting: connecting } = this.state;

        const title = connecting ? cleanProgressStatus(t('Connecting')) : t('AuthAnotherClient');

        return (
            <form className='auth-root'>
                <Typography variant='body1' className='auth-title'>
                    <span>{title}</span>
                    {connecting && <HeaderProgress />}
                </Typography>
                <div className='qr-content'>
                    <div id='qr-canvas'/>
                    <div className='qr-telegram-logo'>
                        <Logo className='telegram-logo'/>
                    </div>
                </div>
                <Typography variant='body1' className='auth-qr-subtitle'>
                    {t('QRHint')}
                </Typography>
                <Typography className='sign-in-continue-on'>
                    <Link onClick={this.handleBack}>
                        {t('LogInByPhone')}
                    </Link>
                </Typography>
            </form>
        );
    }
}

QRCode.propTypes = {
    state: PropTypes.object,
    onChangePhone: PropTypes.func
};

export default withTranslation()(QRCode);