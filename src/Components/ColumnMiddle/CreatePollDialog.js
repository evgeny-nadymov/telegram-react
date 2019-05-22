/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import CreatePollOption from './CreatePollOption';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { utils } from '../../Utils/Key';
import {
    POLL_OPTION_LENGTH,
    POLL_OPTIONS_MAX_COUNT,
    POLL_QUESTION_HINT_LENGTH,
    POLL_QUESTION_LENGTH,
    POLL_QUESTION_MAX_LENGTH
} from '../../Constants';
import './CreatePollDialog.css';

const styles = theme => ({
    dialogRoot: {
        color: theme.palette.text.primary
    },
    contentRoot: {
        width: 300
    },
    listRoot: {
        margin: '0 -24px'
    },
    listItem: {
        padding: '11px 24px',
        color: '#8e9396',
        height: 48
    },
    typographyRoot: {}
});

class CreatePollDialog extends React.Component {
    constructor(props) {
        super(props);

        this.questionRef = React.createRef();
        this.optionsRefMap = new Map();

        this.state = {
            open: false,
            options: [],
            remainLength: POLL_QUESTION_MAX_LENGTH
        };
    }

    handleClose = () => {
        this.setState({ open: false });
    };

    getInnerText = div => {
        const innerText = div.innerText;
        const innerHTML = div.innerHTML;

        if (innerText && innerText === '\n' && innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            div.innerHTML = '';
        }

        return innerText;
    };

    getPoll = () => {
        if (!this.questionRef) return;
        const node = this.questionRef.current;
        if (!node) return;

        const { options } = this.state;

        const question = this.getInnerText(node);
        if (!question) return null;
        if (question.length > POLL_QUESTION_LENGTH) return null;

        const pollOptions = [];
        options.forEach((el, index) => {
            if (this.optionsRefMap.has(index)) {
                const optionRef = this.optionsRefMap.get(index);
                if (optionRef) {
                    const text = optionRef.getText();
                    if (text && text.length <= POLL_OPTION_LENGTH) {
                        pollOptions.push(text);
                    }
                }
            }
        });
        if (pollOptions.length <= 1) return null;

        return {
            '@type': 'inputMessagePoll',
            question,
            options: pollOptions
        };
    };

    handleSend = () => {
        const { onSend } = this.props;

        const poll = this.getPoll();
        if (!poll) return;

        onSend(poll);

        this.handleClose();
    };

    openDialog = () => {
        this.setState({ open: true, options: [] });
    };

    handleKeyDown = event => {
        console.log('Poll.keyDown', event.key, event.keyCode, event);

        const node = this.questionRef.current;
        const maxLength = node.dataset.maxLength;
        const innerText = this.getInnerText(node);
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

        const innerText = this.getInnerText(node);
        if (innerText.length - selection.length >= maxLength) return;

        let pasteText = event.clipboardData.getData('text/plain');
        if (!pasteText) return;

        if (innerText.length - selectionString.length + pasteText.length > maxLength) {
            pasteText = pasteText.substr(0, maxLength - innerText.length + selectionString.length);
        }
        document.execCommand('insertHTML', false, pasteText);
    };

    handleInput = event => {
        event.preventDefault();

        const node = this.questionRef.current;
        const length = node.dataset.length;
        const maxLength = node.dataset.maxLength;

        const innerText = this.getInnerText(node);

        this.setState({
            remainLength: length - innerText.length
        });
    };

    handleAddOption = () => {
        const { options } = this.state;
        if (options.length >= POLL_OPTIONS_MAX_COUNT) return;

        options.push({ id: Date.now() });

        this.setState({ options }, () => {
            setTimeout(() => {
                const node = this.optionsRefMap.get(options.length - 1);
                if (!node) return;

                node.focus();
            });
        });
    };

    handleDeleteOption = id => {
        const { options } = this.state;

        this.setState({ options: options.filter(x => x.id !== id) });
    };

    handleDeleteOptionByBackspace = id => {
        const { options } = this.state;

        const index = options.findIndex(x => x.id === id);
        const prevIndex = index - 1;
        let deleteOption = true;
        for (let i = index; i < options.length; i++) {
            const node = this.optionsRefMap.get(i);
            const text = node ? node.getText() : '';
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
            if (element.childNodes.length > 0) {
                const range = document.createRange();
                range.setStart(element.childNodes[0], element.childNodes[0].length);
                range.collapse(true);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            element.focus();
            return;
        }

        prevNode.focus();
    };

    handleFocusNextOption = id => {
        const { options } = this.state;

        const index = options.findIndex(x => x.id === id);
        const nextIndex = index + 1;

        const nextNode = this.optionsRefMap.get(nextIndex);
        if (!nextNode) {
            const node = this.optionsRefMap.get(index);
            const text = node ? node.getText() : '';
            if (options.length && !text) {
                return;
            }

            this.handleAddOption();
            return;
        }

        nextNode.focus();
    };

    getHint = () => {
        const { options } = this.state;

        const addCount = POLL_OPTIONS_MAX_COUNT - options.length;

        if (addCount <= 0) {
            return 'You have added the maximum number of options.';
        }
        if (addCount === 1) {
            return 'You can add 1 more option.';
        }

        return `You can add ${POLL_OPTIONS_MAX_COUNT - options.length} more options.`;
    };

    render() {
        const { classes, t } = this.props;
        const { remainLength, open, options } = this.state;

        this.optionsRefMap.clear();
        const items = options.map((x, i) => (
            <CreatePollOption
                ref={el => this.optionsRefMap.set(i, el)}
                key={x.id}
                option={x}
                onDelete={this.handleDeleteOption}
                onDeleteByBackspace={this.handleDeleteOptionByBackspace}
                onFocusNext={this.handleFocusNextOption}
            />
        ));

        const canAddOption = POLL_OPTIONS_MAX_COUNT - options.length > 0;
        const hint = this.getHint();

        return (
            <Dialog
                className={classes.dialogRoot}
                open={open}
                transitionDuration={0}
                onClose={this.handleClose}
                aria-labelledby='dialog-title'>
                <DialogTitle id='dialog-title'>{t('NewPoll')}</DialogTitle>
                <DialogContent classes={{ root: classes.contentRoot }}>
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
                    <Typography color='primary' variant='subtitle1'>
                        {t('PollOptions')}
                    </Typography>
                    <List classes={{ root: classes.listRoot }}>
                        {items}
                        {canAddOption && (
                            <ListItem
                                selected={false}
                                className={classes.listItem}
                                button
                                onClick={this.handleAddOption}>
                                <ListItemText disableTypography primary={t('AddAnOption')} />
                            </ListItem>
                        )}
                    </List>
                    <Typography>{hint}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button color='primary' onClick={this.handleClose}>
                        {t('Cancel')}
                    </Button>
                    {
                        <Button color='primary' onClick={this.handleSend}>
                            {t('Send')}
                        </Button>
                    }
                </DialogActions>
            </Dialog>
        );
    }
}

CreatePollDialog.propTypes = {
    onSend: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withStyles(styles),
    withTranslation(),
    withRestoreRef()
);

export default enhance(CreatePollDialog);
