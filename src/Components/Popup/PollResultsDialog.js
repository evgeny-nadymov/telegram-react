/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import PollOptionResults from './PollOptionResults';
import PollStore from '../../Stores/PollStore';
import { modalManager } from '../../Utils/Modal';
import './PollResultsDialog.css';

class PollResultsDialog extends React.Component {
    componentDidMount() {
        PollStore.on('clientUpdateClosePollResults', this.onClientUpdateClosePollResults);
    }

    componentWillUnmount() {
        PollStore.off('clientUpdateClosePollResults', this.onClientUpdateClosePollResults);
    }

    onClientUpdateClosePollResults = update => {
        const { onClose } = this.props;
        onClose();
    };

    handleClose = event => {
        event.preventDefault();
        event.stopPropagation();

        const { onClose } = this.props;
        onClose();
    };

    handleClick = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    handleContextMenu = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    render() {
        const { chatId, messageId, poll, t } = this.props;
        if (!poll) return;

        const { options, type, question } = poll;
        const isQuiz = type && type['@type'] === 'pollTypeQuiz';

        return (
            <Dialog
                classes={{
                    root: 'chat-info-dialog-root',
                    container: 'chat-info-dialog-container',
                    paper: 'chat-info-dialog-paper'
                }}
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClick={this.handleClick}
                onContextMenu={this.handleContextMenu}
                onClose={this.handleClose}
                aria-labelledby='poll-results-title'>
                <DialogTitle id='poll-results-title'>{isQuiz ? t('QuizAnswers') : t('PollResults')}</DialogTitle>
                <DialogContent classes={{ root: 'poll-results-content' }}>
                    <div className='poll-results-question'>{question}</div>
                    {options.map((x, i) => (
                        <PollOptionResults
                            key={i}
                            isQuiz={isQuiz}
                            chatId={chatId}
                            messageId={messageId}
                            optionId={i}
                            option={x}
                        />
                    ))}
                </DialogContent>
            </Dialog>
        );
    }
}

PollResultsDialog.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    poll: PropTypes.object.isRequired
};

export default withTranslation()(PollResultsDialog);
