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
import FireworksComponent from './FireworksControl';
import PollOption from './PollOption';
import { cancelPollAnswer, setPollAnswer, stopPoll } from '../../../Actions/Poll';
import MessageStore from './../../../Stores/MessageStore';
import TdLibController from './../../../Controllers/TdLibController';
import './Poll.css';
import UserTile from '../../Tile/UserTile';

class Poll extends React.Component {
    constructor(props) {
        super(props);

        this.fireworksRef = React.createRef();
        this.state = {
            dialog: false,
            contextMenu: false,
            left: 0,
            top: 0
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId, messageId, poll } = this.props;

        if (poll && poll.type['@type'] === 'pollTypeQuiz') {
            const { poll: prevPoll } = prevProps;
            if (prevPoll.type.correct_option_id === -1 && poll.type.correct_option_id !== -1) {
                const fireworks = this.fireworksRef.current;
                if (!fireworks) return;

                if (poll.options[poll.type.correct_option_id].is_chosen) {
                    fireworks.start();
                } else {
                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateMessageShake',
                        chatId,
                        messageId
                    });
                }
            }
        }
    }

    getTotalVoterCountString = (count, t = key => key) => {
        if (!count) return t('NoVotes');
        if (count === 1) return '1 answer';

        return count + ' answers';
    };

    handleSubmit = event => {
        event.preventDefault();
        event.stopPropagation();

        const { chatId, messageId, poll } = this.props;
        if (!poll) return;

        const { type } = poll;
        if (!type) return;

        if (this.viewResults(poll)) {
            return;
        }

        if (!type.allow_multiple_answers) {
            return;
        }

        const optionIds = [];
        poll.options.forEach((x, index) => {
            if (x.isMultiChoosen) {
                optionIds.push(index);
            }
        });

        if (!optionIds.length) {
            return;
        }

        setPollAnswer(chatId, messageId, optionIds);
    };

    handleVote = index => {
        const { chatId, messageId, poll } = this.props;
        if (!poll) return;

        const { type } = poll;
        if (!type) return;

        if (type['@type'] === 'pollTypeRegular' && type.allow_multiple_answers) {
            poll.options[index].isMultiChoosen = !poll.options[index].isMultiChoosen;
            this.forceUpdate();
        } else {
            setPollAnswer(chatId, messageId, [index]);
        }
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

    viewResults(poll) {
        if (!poll) return false;

        const { options, is_closed, is_anonymous } = poll;
        if (is_anonymous) {
            return false;
        }

        return is_closed || options.some(x => x.is_chosen);
    }

    getOptionType(index, poll) {
        const types = ['regular', 'correct', 'incorrect'];
        const defaultTypeId = 0;
        const correctTypeId = 1;
        const incorrectTypeId = 2;
        if (!poll) return types[defaultTypeId];

        const option = poll.options[index];
        if (!option) return types[defaultTypeId];
        if (!option.is_chosen) return types[defaultTypeId];

        const { type } = poll;
        if (!type) return types[defaultTypeId];
        if (type['@type'] !== 'pollTypeQuiz') return types[defaultTypeId];

        const { correct_option_id } = type;
        if (correct_option_id === -1) return types[defaultTypeId];

        return correct_option_id === index ? types[correctTypeId] : types[incorrectTypeId];
    }

    getOptionIsCorrect(index, poll) {
        if (!poll) return false;

        const option = poll.options[index];
        if (!option) return false;

        const { type } = poll;
        if (!type) return false;
        if (type['@type'] !== 'pollTypeQuiz') return false;

        const { correct_option_id } = type;
        if (correct_option_id === -1) return false;

        return correct_option_id === index;
    }

    handleQuestionClick = event => {
        const { chatId, messageId } = this.props;
        // return;
        event.stopPropagation();

        // const fireworks = this.fireworksRef.current;
        // if (!fireworks) return;
        //
        // fireworks.start();

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMessageShake',
            chatId,
            messageId
        });
    };

    render() {
        const { chatId, messageId, poll, t, meta } = this.props;
        const { left, top, contextMenu, dialog, shake } = this.state;
        const { question, options, total_voter_count, type, is_closed, is_anonymous, recent_voter_user_ids } = poll;

        let subtitle = t('FinalResults');
        if (!is_closed) {
            switch (type['@type']) {
                case 'pollTypeRegular': {
                    subtitle = is_anonymous ? t('AnonymousPoll') : t('PublicPoll');
                    break;
                }
                case 'pollTypeQuiz': {
                    subtitle = is_anonymous ? t('AnonymousQuizPoll') : t('QuizPoll');
                    break;
                }
            }
        }

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const canUnvote = !is_closed && options.some(x => x.is_chosen || x.is_being_chosen);
        const canStopPoll = message && message.can_be_edited;
        const canBeSelected = !is_closed && options.every(x => !x.is_chosen);
        const maxVoterCount = Math.max(...options.map(x => x.voter_count));
        const showViewResults = this.viewResults(poll);
        const showButton = type.allow_multiple_answers || showViewResults;
        const buttonEnabled = showViewResults || options.some(x => x.isMultiChoosen);
        let recentVoters = [];
        if (recent_voter_user_ids) {
            recentVoters = recent_voter_user_ids.map(id => <UserTile poll userId={id} />);
        }

        return (
            <div className='poll' onContextMenu={this.handleContextMenu}>
                <FireworksComponent ref={this.fireworksRef} />
                <div className='poll-question' onClick={this.handleQuestionClick}>
                    <div className='poll-question-title'>{question}</div>
                    <div className='poll-question-subtitle'>
                        <span style={{ marginRight: 6 }}>{subtitle}</span>
                        {recentVoters}
                    </div>
                </div>
                <div className='poll-options'>
                    {options.map((x, index) => (
                        <PollOption
                            key={index}
                            type={this.getOptionType(index, poll)}
                            isCorrect={this.getOptionIsCorrect(index, poll)}
                            option={x}
                            canBeSelected={canBeSelected}
                            closed={is_closed}
                            maxVoterCount={maxVoterCount}
                            onVote={() => this.handleVote(index)}
                            onUnvote={this.handleUnvote}
                        />
                    ))}
                </div>
                {showButton && (
                    <Button fullWidth color='primary' disabled={!buttonEnabled} onClick={this.handleSubmit}>
                        {showViewResults ? t('PollViewResults') : t('PollSubmitVotes')}
                    </Button>
                )}
                {!showButton && (
                    <div className='poll-total-count'>
                        {this.getTotalVoterCountString(total_voter_count, t)}
                        {meta}
                    </div>
                )}
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
    openMedia: PropTypes.func
};

export default withTranslation()(Poll);
