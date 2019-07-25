/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import CheckDecagramIcon from 'mdi-material-ui/CheckDecagram';
import { getChatTitle, isChatVerified } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import './DialogTitle.css';

const styles = theme => ({
    icon: {
        height: 16,
        color: theme.palette.primary.main
    },
    verifiedIcon: {}
});

class DialogTitle extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chatId !== this.props.chatId) {
            return true;
        }

        if (nextProps.t !== this.props.t) {
            return true;
        }

        if (nextProps.theme !== this.props.theme) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
    }

    componentWillUnmount() {
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.removeListener('updateChatTitle', this.onUpdateChatTitle);
    }

    onFastUpdatingComplete = update => {
        this.forceUpdate();
    };

    onUpdateChatTitle = update => {
        const { chatId } = this.props;

        if (update.chat_id !== chatId) return;

        this.forceUpdate();
    };

    render() {
        const { classes, t, chatId, showSavedMessages } = this.props;

        const isVerified = isChatVerified(chatId);
        const title = getChatTitle(chatId, showSavedMessages, t);

        return (
            <div className='dialog-title'>
                <span className='dialog-title-span'>{title}</span>
                {isVerified && (
                    <CheckDecagramIcon
                        className={classNames(classes.icon, classes.verifiedIcon, 'dialog-title-icon')}
                    />
                )}
            </div>
        );
    }
}

DialogTitle.propTypes = {
    chatId: PropTypes.number.isRequired,
    showSavedMessages: PropTypes.bool
};

DialogTitle.defaultProps = {
    showSavedMessages: true
};

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(DialogTitle);
