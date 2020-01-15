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
import ArchiveIcon from '@material-ui/icons/Archive';
import ChatTile from './ChatTile';
import DialogTitle from './DialogTitle';
import DialogMeta from './DialogMeta';
import DialogContent from './DialogContent';
import DialogBadge from './DialogBadge';
import { isPrivateChat } from '../../Utils/Chat';
import ChatStatus from './ChatStatus';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import './Archive.css';
import { orderCompare } from '../../Utils/Common';
import AppStore from '../../Stores/ApplicationStore';

const styles = theme => ({
    menuListRoot: {
        minWidth: 150
    },
    statusRoot: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        zIndex: 1
    },
    unreadIcon: {
        background: theme.palette.primary.light
    },
    dialog: {
        borderRadius: 8,
        cursor: 'pointer',
        margin: '0 12px',
        '&:hover': {
            backgroundColor: theme.palette.primary.main + '22'
        }
    },
    dialogContent: {
        color: theme.palette.text.secondary
    }
});

class Archive extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { title, theme } = this.props;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.title !== title) {
            return true;
        }

        return false;
    }

    onUpdateChatOrder = update => {
        const { chat_id } = update;

        const archive = ChatStore.chatList.get('chatListArchive');
        if (archive && archive.has(chat_id)) {
            this.setState({ title: this.getTitle() });
        }
    };

    handleSelect = event => {
        if (event.button === 0) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateOpenArchive'
            });
        }
    };

    render() {
        const { classes, t, title } = this.props;

        return (
            <div
                ref={this.dialog}
                className={classNames(classes.dialog, 'dialog')}
                onMouseDown={this.handleSelect}
                onContextMenu={this.handleContextMenu}>
                <div className='dialog-wrapper'>
                    <div className='chat-tile'>
                        <div className='archive-tile-background tile-photo'>
                            <div className='tile-saved-messages'>
                                <ArchiveIcon fontSize='default' />
                            </div>
                        </div>
                    </div>
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <div className='dialog-title'>
                                <span className='dialog-title-span'>{t('ArchivedChats')}</span>
                            </div>
                        </div>
                        <div className='tile-second-row'>
                            <div className={classNames('dialog-content', classes.dialogContent)}>{title}</div>
                            {/*{unread_count > 0 && (*/}
                            {/*    <div className={classNames('dialog-badge-muted', 'dialog-badge')}>*/}
                            {/*        <span className='dialog-badge-text'>{unread_count}</span>*/}
                            {/*    </div>*/}
                            {/*)}*/}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Archive.propTypes = {
    title: PropTypes.string
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(Archive);
