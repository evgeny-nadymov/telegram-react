/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Popover from '@material-ui/core/Popover';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PollOption from './PollOption';
import { cancelPollAnswer, setPollAnswer, stopPoll } from '../../../Actions/Poll';
import MessageStore from './../../../Stores/MessageStore';
import './Poll.css';

class Poll extends React.Component {
    state = {
        dialog: false,
        contextMenu: false,
        left: 0,
        top: 0
    };

    getTotalVoterCountString = (count, t = key => key) => {
        if (!count) return t('NoVotes');
        if (count === 1) return '1 vote';

        return count + ' votes';
    };

    handleVote = index => {
        const { chatId, messageId } = this.props;

        setPollAnswer(chatId, messageId, [index]);
    };

    handleUnvote = event => {
        if (event) {
            event.stopPropagation();
        }

        const { chatId, messageId, poll } = this.props;
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.handleCloseContextMenu();
        }

        const { is_closed } = poll;
        if (is_closed) return;

        cancelPollAnswer(chatId, messageId);
    };

    handleStopPoll = event => {
        event.stopPropagation();

        const { chatId, messageId } = this.props;
        const { dialog } = this.state;

        if (dialog) {
            this.setState({ dialog: false });
        }

        stopPoll(chatId, messageId);
    };

    handleDialog = event => {
        const { dialog } = this.state;
        if (dialog) return;

        this.setState({
            dialog: true,
            contextMenu: false
        });
    };

    handleCloseDialog = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ dialog: false });
    };

    handleContextMenu = event => {
        const { poll } = this.props;
        const { is_closed } = poll;
        if (is_closed) return;

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            this.setState({
                contextMenu: true,
                left: event.clientX,
                top: event.clientY
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    render() {
        const { chatId, messageId, poll, t } = this.props;
        const { left, top, contextMenu, dialog } = this.state;
        const { question, options, total_voter_count, is_closed } = poll;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const canUnvote = !is_closed && options.some(x => x.is_chosen || x.is_being_chosen);
        const canStopPoll = message && message.can_be_edited;
        const canBeSelected = !is_closed && options.every(x => !x.is_chosen);
        const maxVoterCount = Math.max(...options.map(x => x.voter_count));

        return (
            <div className='poll' onContextMenu={this.handleContextMenu}>
                <div className='poll-question'>
                    <span className='poll-question-title'>{question}</span>
                    <span className='subtitle'>{is_closed ? t('FinalResults') : t('AnonymousPoll')}</span>
                </div>
                <div className='poll-options'>
                    {options.map((x, index) => (
                        <PollOption
                            key={index}
                            option={x}
                            canBeSelected={canBeSelected}
                            closed={is_closed}
                            maxVoterCount={maxVoterCount}
                            onVote={() => this.handleVote(index)}
                            onUnvote={this.handleUnvote}
                        />
                    ))}
                </div>
                <div className='poll-total-count subtitle'>{this.getTotalVoterCountString(total_voter_count, t)}</div>
                <Popover
                    open={contextMenu && (canUnvote || canStopPoll)}
                    onClose={this.handleCloseContextMenu}
                    anchorReference='anchorPosition'
                    anchorPosition={{ top, left }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}>
                    <MenuList onClick={e => e.stopPropagation()}>
                        {canUnvote && <MenuItem onClick={this.handleUnvote}>{t('Unvote')}</MenuItem>}
                        {canStopPoll && <MenuItem onClick={this.handleDialog}>{t('StopPoll')}</MenuItem>}
                    </MenuList>
                </Popover>
                <Dialog
                    transitionDuration={0}
                    open={dialog}
                    onClose={this.handleCloseDialog}
                    aria-labelledby='form-dialog-title'>
                    <DialogTitle id='form-dialog-title'>{t('StopPollAlertTitle')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>{t('StopPollAlertText')}</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseDialog} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleStopPoll} color='primary'>
                            {t('Stop')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

Poll.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    poll: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired
};

export default withTranslation()(Poll);
