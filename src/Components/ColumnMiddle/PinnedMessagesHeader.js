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
    state = { };

    componentDidMount() {
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateMessageSelected);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
    }

    componentWillUnmount() {

        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateMessageSelected);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
    }

    onClientUpdateMessageSelected = update => {
        this.setState({ selectedCount: MessageStore.selectedItems.size });
    }

    handleClose = () => {
        const { selectedCount } = this.state;
        if (selectedCount > 0) {
            clearSelection();
        }

        closePinned();
    };

    render() {
        const { chatId, t } = this.props;
        const { selectedCount } = this.state;

        const media = MessageStore.getMedia(chatId);

        const title = media && media.pinned.length ? `${media.pinned.length} ${t('PinnedMessages')}` : t('PinnedMessages');

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