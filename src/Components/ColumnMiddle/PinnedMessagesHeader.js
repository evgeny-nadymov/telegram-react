/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '../../Assets/Icons/Back';
import HeaderCommand from './HeaderCommand';
import { clearSelection, closePinned } from '../../Actions/Client';
import MessageStore from '../../Stores/MessageStore';
import './PinnedMessagesHeader.css'

class PinnedMessagesHeader extends React.Component {
    constructor(props) {
        super(props);

        const media = MessageStore.getMedia(props.chatId);

        this.state = {
            selectedCount: MessageStore.selectedItems.size,
            pinnedCount: media && media.pinned.length ? media.pinned.length : 0
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { selectedCount, pinnedCount } = this.state;

        if (nextState.selectedCount !== selectedCount) {
            return true;
        }

        if (nextState.pinnedCount !== pinnedCount) {
            return true;
        }

        return true;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateMessageSelected);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.on('updateMessageIsPinned', this.onUpdateMessageIsPinned);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateMessageSelected);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.off('updateMessageIsPinned', this.onUpdateMessageIsPinned);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
    }

    onUpdateDeleteMessages = update => {
        const { chatId } = this.props;
        const { chat_id } = update;
        if (chatId !== chat_id) return;

        const media = MessageStore.getMedia(chatId);
        const pinnedCount = media && media.pinned.length ? media.pinned.length : 0

        this.setState({
            pinnedCount
        });
    };

    onUpdateMessageIsPinned = update => {
        const { chatId } = this.props;
        const { chat_id } = update;
        if (chatId !== chat_id) return;

        const media = MessageStore.getMedia(chatId);
        const pinnedCount = media && media.pinned.length ? media.pinned.length : 0

        this.setState({
            pinnedCount
        });
    };

    onClientUpdateMessageSelected = update => {
        this.setState({
            selectedCount: MessageStore.selectedItems.size
        });
    }

    handleClose = () => {
        const { selectedCount } = this.state;
        if (selectedCount > 0) {
            clearSelection();
        }

        closePinned();
    };

    render() {
        const { t } = this.props;
        const { selectedCount, pinnedCount } = this.state;

        let title = t('PinnedMessages');
        if (pinnedCount === 1) {
            title = t('PinnedMessage');
        } else if (pinnedCount > 1) {
            title = `${pinnedCount} ${t('PinnedMessages')}`;
        }

        return (
            <div className={classNames('header-details', { 'header-details-selection': selectedCount > 0 })}>
                <IconButton
                    className='header-left-button main-menu-button'
                    onClick={this.handleClose}>
                    <ArrowBackIcon />
                </IconButton>
                <div className='header-details-content'>
                    <HeaderCommand count={selectedCount}/>
                    <div className={classNames('header-status', 'grow')}>
                        <span className='header-status-content'>{title}</span>
                    </div>
                </div>
            </div>
        );
    }

}

PinnedMessagesHeader.propTypes = {
    chatId: PropTypes.number
};

export default withTranslation()(PinnedMessagesHeader);