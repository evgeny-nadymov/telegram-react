/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
// import { ReactComponent as BubblesLogo } from '../../Assets/Bubbles.svg';
import AppStore from '../../Stores/ApplicationStore';
import './Placeholder.css';

class Placeholder extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, dialogsReady, cacheLoaded } = AppStore;
        this.state = {
            chatId,
            dialogsReady,
            cacheLoaded
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextState.chatId !== this.state.chatId) {
            return true;
        }

        if (nextState.dialogsReady !== this.state.dialogsReady) {
            return true;
        }

        if (nextState.cacheLoaded !== this.state.cacheLoaded) {
            return true;
        }

        if (nextProps.t !== this.props.t) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);
        AppStore.on('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        AppStore.on('clientUpdateCacheLoaded', this.onClientUpdateCacheLoaded);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);
        AppStore.off('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        AppStore.off('clientUpdateCacheLoaded', this.onClientUpdateCacheLoaded);
    }

    onClientUpdateCacheLoaded = update => {
        const { cacheLoaded } = AppStore;

        this.setState({ cacheLoaded });
    };

    onClientUpdateChatId = update => {
        const { nextChatId: chatId } = update;

        this.setState({ chatId });
    };

    onClientUpdateDialogsReady = update => {
        const { dialogsReady } = AppStore;

        this.setState({ dialogsReady });
    };

    render() {
        const { t, force } = this.props;
        const { chatId, dialogsReady, cacheLoaded } = this.state;
        if (chatId) return null;
        // if (!dialogsReady && !cacheLoaded) return null;

        return (
            <div className='placeholder'>
                <div className='placeholder-wrapper'>
                    {/*<BubblesLogo className='placeholder-logo' />*/}
                    <div className='placeholder-meta'>{t('SelectChatToStartMessaging')}</div>
                </div>
            </div>
        );
    }
}

export default withTranslation()(Placeholder);
