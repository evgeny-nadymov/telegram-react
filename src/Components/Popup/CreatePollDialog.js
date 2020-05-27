/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withSnackbar } from 'notistack';
import { withRestoreRef, withSaveRef, compose } from '../../Utils/HOC';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CloseIcon from '../../Assets/Icons/Close';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import CreatePollOption from './CreatePollOption';
import { focusNode } from '../../Utils/Component';
import { utils } from '../../Utils/Key';
import { hasPollData, isValidPoll } from '../../Utils/Poll';
import { modalManager } from '../../Utils/Modal';
import {
    NOTIFICATION_AUTO_HIDE_DURATION_MS,
    POLL_OPTIONS_MAX_COUNT,
    POLL_QUESTION_HINT_LENGTH,
    POLL_QUESTION_LENGTH,
    POLL_QUESTION_MAX_LENGTH
} from '../../Constants';
import PollStore from '../../Stores/PollStore';
import TdLibController from '../../Controllers/TdLibController';
import './CreatePollDialog.css';

class CreatePollDialog extends React.Component {
    constructor(props) {
        super(props);

        this.questionRef = React.createRef();
        this.optionsRefMap = new Map();

        this.state = {
            poll: null,
            confirm: false,
            remainLength: POLL_QUESTION_MAX_LENGTH
        };
    }

    componentDidMount() {
        PollStore.on('clientUpdatePollChooseOption', this.handleClientUpdatePoll);
        PollStore.on('clientUpdatePollChangeAnonymous', this.handleClientUpdatePoll);
        PollStore.on('clientUpdatePollChangeAllowMultipleAnswers', this.handleClientUpdatePoll);
        PollStore.on('clientUpdatePollChangeType', this.handleClientUpdatePoll);
        PollStore.on('clientUpdateDeletePoll', this.handleClientUpdatePoll);
        PollStore.on('clientUpdateDeletePollOption', this.handleClientUpdatePoll);
        PollStore.on('clientUpdateNewPoll', this.handleClientUpdateNewPoll);
        PollStore.on('clientUpdateNewPollOption', this.handleClientUpdateNewPollOption);
        PollStore.on('clientUpdatePollOption', this.handleClientUpdatePoll);
        PollStore.on('clientUpdatePollQuestion', this.handleClientUpdatePollQuestion);
    }

    componentWillUnmount() {
        PollStore.off('clientUpdatePollChooseOption', this.handleClientUpdatePoll);
        PollStore.off('clientUpdatePollChangeAnonymous', this.handleClientUpdatePoll);
        PollStore.off('clientUpdatePollChangeAllowMultipleAnswers', this.handleClientUpdatePoll);
        PollStore.off('clientUpdatePollChangeType', this.handleClientUpdatePoll);
        PollStore.off('clientUpdateDeletePoll', this.handleClientUpdatePoll);
        PollStore.off('clientUpdateDeletePollOption', this.handleClientUpdatePoll);
        PollStore.off('clientUpdateNewPoll', this.handleClientUpdateNewPoll);
        PollStore.off('clientUpdateNewPollOption', this.handleClientUpdateNewPollOption);
        PollStore.off('clientUpdatePollOption', this.handleClientUpdatePoll);
        PollStore.off('clientUpdatePollQuestion', this.handleClientUpdatePollQuestion);
    }

    handleClientUpdateNewPoll = update => {
        const { poll } = PollStore;

        this.setState({
            confirm: false,
            remainLength: POLL_QUESTION_MAX_LENGTH,
            poll
        });
    };

    handleClientUpdatePollQuestion = update => {
        const { poll } = PollStore;

        const node = this.questionRef.current;
        const length = node.dataset.length;
        const innerText = node.innerText;

        this.setState({
            remainLength: length - innerText.length,
            poll
        });
    };

    handleClientUpdatePoll = update => {
        const { poll } = PollStore;

        this.setState({ poll });
    };

    handleClientUpdateNewPollOption = update => {
        const { poll } = PollStore;

        this.setState({ poll }, () => {
            setTimeout(() => {
                const node = this.optionsRefMap.get(poll.options.length - 1);

                node.focus(true);
            });
        });
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { poll } = this.state;

        if (poll && !prevState.poll) {
            setTimeout(() => {
                focusNode(this.questionRef.current, true);
            }, 0);
        }
    }

    handleKeyDown = event => {
        const node = this.questionRef.current;
        const maxLength = node.dataset.maxLength;
        const innerText = node.innerText;
        const length = innerText.length;

        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        switch (event.key) {
            case 'Enter': {
                if (!event.shiftKey) {
                    this.handleFocusNextOption(0);

                    event.preventDefault();
                    return false;
                }

                break;
            }
            case 'ArrowDown': {
                const selection = window.getSelection();
                if (!selection) break;
                if (!selection.isCollapsed) break;

                const lastChild =
                    node.childNodes && node.childNodes.length > 0 ? node.childNodes[node.childNodes.length - 1] : null;

                if (!lastChild || (selection.anchorNode === lastChild && selection.anchorOffset === lastChild.length)) {
                    this.handleFocusNextOption(0);

                    event.preventDefault();
                    return false;
                }

                break;
            }
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (length >= maxLength && !hasSelection) {
            event.preventDefault();
            return false;
        }

        return true;
    };

    handlePaste = event => {
        event.preventDefault();

        const node = this.questionRef.current;
        const maxLength = node.dataset.maxLength;

        const selection = window.getSelection();
        const selectionString = selection ? selection.toString() : '';

        const innerText = node.innerText;
        if (innerText.length - selection.length >= maxLength) return;

        let pasteText = event.clipboardData.getData('text/plain');
        if (!pasteText) return;

        if (innerText.length - selectionString.length + pasteText.length > maxLength) {
            pasteText = pasteText.substr(0, maxLength - innerText.length + selectionString.length);
        }
        document.execCommand('insertText', false, pasteText);
    };

    handleInput = event => {
        event.preventDefault();

        const node = this.questionRef.current;
        //const length = node.dataset.length;

        const innerText = node.innerText;
        const innerHtml = node.innerHTML;

        if (innerHtml === '<br>') {
            node.innerText = '';
        }

        // this.setState({
        //     remainLength: length - innerText.length
        // });

        TdLibController.clientUpdate({
            '@type': 'clientUpdatePollQuestion',
            question: innerText
        });
    };

    handleAddOption = () => {
        const { poll } = this.state;
        if (!poll) return;

        const { options } = poll;
        if (options.length >= POLL_OPTIONS_MAX_COUNT) return;

        const option = {
            id: Date.now(),
            text: ''
        };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewPollOption',
            option
        });
    };

    handleDeleteOption = (id, backspace = false) => {
        if (backspace) {
            this.handleDeleteByBackspace(id);
        } else {
            this.handleDelete(id);
        }
    };

    handleDelete = id => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateDeletePollOption',
            id
        });
    };

    handleDeleteByBackspace = id => {
        const { poll } = this.state;
        if (!poll) return;

        const { options } = poll;

        const index = options.findIndex(x => x.id === id);
        const prevIndex = index - 1;
        let deleteOption = true;
        for (let i = index; i < options.length; i++) {
            const { text } = options[i];
            if (text) {
                deleteOption = false;
                break;
            }
        }

        if (deleteOption) {
            this.handleDeleteOption(id);
        }

        const prevNode = this.optionsRefMap.get(prevIndex);
        if (!prevNode) {
            const element = this.questionRef.current;

            focusNode(element, true);
            return;
        }

        prevNode.focus(true);
    };

    handleFocusPrevOption = id => {
        const { poll } = this.state;
        if (!poll) return;

        const { options } = poll;

        const index = options.findIndex(x => x.id === id);
        const prevIndex = index - 1;

        const prevNode = this.optionsRefMap.get(prevIndex);
        if (!prevNode) {
            const element = this.questionRef.current;

            focusNode(element, false);
            return;
        }

        prevNode.focus(false);
    };

    handleFocusNextOption = id => {
        const { poll } = this.state;
        if (!poll) return;

        const { options } = poll;

        const index = options.findIndex(x => x.id === id);
        const nextIndex = index + 1;

        const nextNode = this.optionsRefMap.get(nextIndex);
        if (!nextNode) {
            const text = index >= 0 && index < options.length ? options[index].text : '';
            if (options.length && !text) {
                return;
            }

            this.handleAddOption();
            return;
        }

        nextNode.focus(nextNode, true);
    };

    getHint = () => {
        const { poll } = this.state;
        if (!poll) return;

        const { options } = poll;

        const addCount = POLL_OPTIONS_MAX_COUNT - options.length;

        if (addCount <= 0) {
            return 'You have added the maximum number of options.';
        }
        if (addCount === 1) {
            return 'You can add 1 more option.';
        }

        return `You can add ${POLL_OPTIONS_MAX_COUNT - options.length} more options.`;
    };

    handleClose = () => {
        const { poll } = this.state;

        if (hasPollData(poll)) {
            this.setState({ confirm: true });
        } else {
            this.handleConfirmationDone();
        }
    };

    handleSend = () => {
        const { onSend } = this.props;

        const inputMessagePoll = PollStore.getInputMessagePoll();
        if (!inputMessagePoll) return;

        onSend(inputMessagePoll);

        this.handleConfirmationDone();
    };

    handleConfirmationClose = () => {
        this.setState({ confirm: false });
    };

    handleConfirmationDone = () => {
        this.handleConfirmationClose();

        TdLibController.clientUpdate({
            '@type': 'clientUpdateDeletePoll'
        });
    };

    handleChangeAnonymous = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdatePollChangeAnonymous'
        });
    };

    handleChangeAllowMultipleAnswers = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdatePollChangeAllowMultipleAnswers'
        });
    };

    handleChangeType = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdatePollChangeType'
        });
    };

    handleScheduledAction = message => {
        const { enqueueSnackbar, closeSnackbar } = this.props;

        const snackKey = enqueueSnackbar(message, {
            autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
            preventDuplicate: true,
            action: [
                <IconButton
                    key='close'
                    aria-label='Close'
                    color='inherit'
                    className='notification-close-button'
                    onClick={() => closeSnackbar(snackKey)}>
                    <CloseIcon />
                </IconButton>
            ]
        });
    };

    handleAllowMultipleAnswersClick = event => {
        const { t } = this.props;
        const { poll } = this.state;
        if (!poll) return;

        const quizPoll = poll.type['@type'] === 'pollTypeQuiz';
        if (quizPoll) {
            event.stopPropagation();

            this.handleScheduledAction(t('PollQuizOneRightAnswer'));
        }
    };

    render() {
        const { t } = this.props;
        const { remainLength, confirm, poll } = this.state;
        if (!poll) return null;

        const { is_anonymous } = poll;

        const options = poll ? poll.options : [];
        const allowMultipleAnswers = poll.type.allow_multiple_answers;
        const allowMultipleAnswersDisabled = poll.type['@type'] !== 'pollTypeRegular';
        const quizPoll = poll.type['@type'] === 'pollTypeQuiz';

        this.optionsRefMap.clear();
        const items = options.map((x, i) => (
            <CreatePollOption
                ref={el => this.optionsRefMap.set(i, el)}
                key={x.id}
                option={x}
                onDelete={this.handleDeleteOption}
                onFocusPrev={this.handleFocusPrevOption}
                onFocusNext={this.handleFocusNextOption}
            />
        ));

        const canAddOption = POLL_OPTIONS_MAX_COUNT - options.length > 0;
        const hint = this.getHint();

        return (
            <>
                <Dialog
                    className={classNames('create-poll-dialog', { 'create-quiz-dialog': quizPoll })}
                    open
                    manager={modalManager}
                    transitionDuration={0}
                    onClose={this.handleClose}
                    aria-labelledby='dialog-title'>
                    <DialogTitle id='dialog-title'>{t('NewPoll')}</DialogTitle>
                    <DialogContent classes={{ root: 'create-poll-dialog-root' }}>
                        <div className='create-poll-dialog-question-title'>
                            <Typography color='primary' variant='subtitle1' style={{ flexGrow: 1 }}>
                                {t('Question')}
                            </Typography>
                            {remainLength <= POLL_QUESTION_LENGTH - POLL_QUESTION_HINT_LENGTH && (
                                <Typography color={remainLength >= 0 ? 'textSecondary' : 'error'} variant='subtitle1'>
                                    {remainLength}
                                </Typography>
                            )}
                        </div>
                        <div
                            ref={this.questionRef}
                            id='create-poll-dialog-question'
                            contentEditable
                            suppressContentEditableWarning
                            placeholder={t('QuestionHint')}
                            data-length={POLL_QUESTION_LENGTH}
                            data-max-length={POLL_QUESTION_MAX_LENGTH}
                            onPaste={this.handlePaste}
                            onKeyDown={this.handleKeyDown}
                            onInput={this.handleInput}
                        />
                        <Divider className='divider' />
                        <Typography color='primary' variant='subtitle1'>
                            {t('PollOptions')}
                        </Typography>
                        <List classes={{ root: 'create-poll-dialog-list' }}>
                            {items}
                            {canAddOption && (
                                <ListItem
                                    selected={false}
                                    className='create-poll-add-option'
                                    button
                                    onClick={this.handleAddOption}>
                                    <ListItemText disableTypography primary={t('AddAnOption')} />
                                </ListItem>
                            )}
                        </List>
                        <Typography>{hint}</Typography>
                        <Divider className='divider' />
                        <Typography color='primary' variant='subtitle1'>
                            {t('Settings')}
                        </Typography>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        color='primary'
                                        checked={is_anonymous}
                                        onChange={this.handleChangeAnonymous}
                                    />
                                }
                                label={t('PollAnonymous')}
                            />
                            <div onClick={this.handleAllowMultipleAnswersClick} style={{ background: 'transparent' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            color='primary'
                                            disabled={allowMultipleAnswersDisabled}
                                            checked={allowMultipleAnswers}
                                            onChange={this.handleChangeAllowMultipleAnswers}
                                        />
                                    }
                                    label={t('PollMultiple')}
                                />
                            </div>
                            <FormControlLabel
                                control={
                                    <Checkbox color='primary' checked={quizPoll} onChange={this.handleChangeType} />
                                }
                                label={t('PollQuiz')}
                            />
                        </FormGroup>
                        <Typography>{t('QuizInfo')}</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button color='primary' onClick={this.handleClose}>
                            {t('Cancel')}
                        </Button>
                        {isValidPoll(poll) && (
                            <Button color='primary' onClick={this.handleSend}>
                                {t('Create')}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
                <Dialog
                    className='create-poll-dialog-root'
                    open={confirm}
                    manager={modalManager}
                    transitionDuration={0}
                    onClose={this.handleConfirmationClose}
                    aria-labelledby='dialog-title'>
                    <DialogTitle id='dialog-title'>{t('CancelPollAlertTitle')}</DialogTitle>
                    <DialogContent classes={{ root: 'create-poll-dialog-root' }}>
                        {t('CancelPollAlertText')}
                    </DialogContent>
                    <DialogActions>
                        <Button color='primary' onClick={this.handleConfirmationClose}>
                            {t('Cancel')}
                        </Button>
                        <Button color='primary' onClick={this.handleConfirmationDone}>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

CreatePollDialog.propTypes = {
    onSend: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withSnackbar,
    withRestoreRef()
);

export default enhance(CreatePollDialog);
