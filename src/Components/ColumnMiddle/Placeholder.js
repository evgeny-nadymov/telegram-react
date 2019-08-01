/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import { ReactComponent as BubblesLogo } from '../../Assets/Bubbles.svg';
import ApplicationStore from '../../Stores/ApplicationStore';
import './Placeholder.css';

class Placeholder extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, dialogsReady } = ApplicationStore;
        this.state = {
            chatId,
            dialogsReady
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextState.chatId !== this.state.chatId) {
            return true;
        }

        if (nextState.dialogsReady !== this.state.dialogsReady) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
        ApplicationStore.on('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
        ApplicationStore.removeListener('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
    }

    onClientUpdateChatId = update => {
        const { nextChatId: chatId } = update;

        this.setState({ chatId });
    };

    onClientUpdateDialogsReady = update => {
        const { dialogsReady } = ApplicationStore;

        this.setState({ dialogsReady });
    };

    render() {
        const { t } = this.props;
        const { chatId, dialogsReady } = this.state;
        if (chatId) return null;
        if (!dialogsReady) return null;

        return (
            <div className='placeholder'>
                <div className='placeholder-wrapper'>
                    <BubblesLogo className='placeholder-logo' />
                    {t('SelectChatToStartMessaging')}
                </div>
            </div>
        );
    }
}

Placeholder.propTypes = {};

export default withTranslation()(Placeholder);
