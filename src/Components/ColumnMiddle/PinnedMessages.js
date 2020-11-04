/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import FooterCommand from './FooterCommand';
import MessagesList from './MessagesList';
import PinnedMessagesHeader from './PinnedMessagesHeader';
import { requestUnpinMessage } from '../../Actions/Client';
import { canPinMessages } from '../../Utils/Chat';
import MessageStore from '../../Stores/MessageStore';
import './PinnedMessages.css';

class PinnedMessages extends React.Component {

    state = { };

    static getDerivedStateFromProps(props, state) {
        const { prevChatId } = state;
        const { chatId } = props;
        if (prevChatId !== chatId) {
            return {
                prevChatId: chatId,
                opened: false
            };
        }

        return null;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateOpenPinned', this.onClientUpdateOpenPinned);
        MessageStore.on('clientUpdateClosePinned', this.onClientUpdateClosePinned);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateOpenPinned', this.onClientUpdateOpenPinned);
        MessageStore.off('clientUpdateClosePinned', this.onClientUpdateClosePinned);
    }

    onClientUpdateOpenPinned = update => {
        const { chatId: currentChatId } = this.props;
        const { chatId } = update;

        if (currentChatId !== chatId) return;

        this.setState({
            opened: true
        });
    };

    onClientUpdateClosePinned = update => {
        this.setState({
            opened: false
        });
    };

    handleUnpinAll = async () => {
        const { chatId } = this.props;

        requestUnpinMessage(chatId, null);
    }

    render() {
        const { chatId, t } = this.props;
        const { opened } = this.state;
        if (!opened) return null;

        const unpinAllTitle = canPinMessages(chatId) ? t('UnpinAllMessages') : t('HidePinnedMessages');

        return (
            <div className='pinned-messages'>
                <div className='pinned-messages-wrapper'>
                    <div className='dialog-background'/>
                    <div className='dialog-details-wrapper'>
                        <PinnedMessagesHeader chatId={chatId} />
                        <MessagesList chatId={chatId} filter={{ '@type': 'searchMessagesFilterPinned' }}/>
                        <FooterCommand command={unpinAllTitle} onCommand={this.handleUnpinAll} />
                    </div>
                </div>
            </div>
        );

        // return (
        //     <SidebarPage open={opened} timeout={250} onClose={this.handleClose}>
        //
        //     </SidebarPage>
        // );
    }
}

PinnedMessages.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(PinnedMessages);