/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ReplyIcon from '@material-ui/icons/Reply';
import EditIcon from '@material-ui/icons/Edit';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import withStyles from '@material-ui/core/styles/withStyles';
import Reply from '../Message/Reply';
import './InputBoxHeader.css';

const styles = theme => ({
    replyIcon: {
        padding: 12,
        color: theme.palette.action.active
    },
    editIcon: {
        padding: 12,
        color: theme.palette.action.active
    },
    closeIconButton: {
        margin: 0
    }
});

class InputBoxHeader extends React.Component {
    render() {
        const { classes, chatId, messageId, editMode } = this.props;
        if (!chatId) return null;
        if (!messageId) return null;

        return (
            <div className='inputbox-header'>
                <div className='inputbox-header-left-column'>
                    {editMode ? <EditIcon className={classes.replyIcon} /> : <ReplyIcon className={classes.editIcon} />}
                </div>
                <div className='inputbox-header-middle-column'>
                    <Reply chatId={chatId} messageId={messageId} />
                </div>
                <div className='inputbox-header-right-column'>
                    <IconButton className={classes.closeIconButton} aria-label='Close' onClick={this.props.onClose}>
                        <CloseIcon />
                    </IconButton>
                </div>
            </div>
        );
    }
}

InputBoxHeader.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    editMode: PropTypes.bool
};

export default withStyles(styles)(InputBoxHeader);
