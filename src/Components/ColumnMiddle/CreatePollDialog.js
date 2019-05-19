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
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import PollOptionItem from './PollOptionItem';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { POLL_OPTIONS_MAX_COUNT } from '../../Constants';
import './CreatePollDialog.css';

const styles = {
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
};

class CreatePollDialog extends React.Component {
    constructor(props) {
        super(props);

        this.questionRef = React.createRef();
        this.optionsRefMap = new Map();

        this.state = {
            open: false,
            options: []
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

    handleSend = () => {
        const { onSend } = this.props;
        const { options } = this.state;

        const question = this.getInnerText(this.questionRef.current);
        if (!question) return;

        if (!options.length) return;

        const pollOptions = [];
        options.forEach((el, index) => {
            if (this.optionsRefMap.has(index)) {
                const optionRef = this.optionsRefMap.get(index);
                if (optionRef) {
                    const text = optionRef.getText();
                    if (text) {
                        pollOptions.push(text);
                    }
                }
            }
        });
        if (pollOptions.length <= 1) return;

        const poll = {
            '@type': 'inputMessagePoll',
            question,
            options: pollOptions
        };

        onSend(poll);

        this.handleClose();
    };

    openDialog = () => {
        this.setState({ open: true, options: [] });
    };

    handleQuestionKeyUp = event => {};

    handleQuestionPaste = event => {};

    handleQuestionChange = event => {};

    handleAddPollOption = () => {
        const { options } = this.state;
        if (options.length >= POLL_OPTIONS_MAX_COUNT) return;

        options.push({ id: Date.now() });

        this.setState({ options }, () => {
            setTimeout(() => {
                if (this.optionsRefMap.has(options.length - 1)) {
                    const optionRef = this.optionsRefMap.get(options.length - 1);
                    if (optionRef) {
                        optionRef.focus();
                    }
                }
            });
        });
    };

    handleDeletePollOption = id => {
        const { options } = this.state;

        this.setState({ options: options.filter(x => x.id !== id) });
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
        const { open, options } = this.state;

        this.optionsRefMap.clear();
        const items = options.map((x, i) => (
            <PollOptionItem
                ref={el => this.optionsRefMap.set(i, el)}
                key={x.id}
                option={x}
                onDelete={this.handleDeletePollOption}
            />
        ));

        const canAddOption = POLL_OPTIONS_MAX_COUNT - options.length > 0;
        const hint = this.getHint();

        return (
            <Dialog open={open} transitionDuration={0} onClose={this.handleClose} aria-labelledby='dialog-title'>
                <DialogTitle id='dialog-title'>{t('NewPoll')}</DialogTitle>
                <DialogContent classes={{ root: classes.contentRoot }}>
                    <Typography color='primary' variant='subheading'>
                        {t('Question')}
                    </Typography>
                    <div
                        ref={this.questionRef}
                        id='create-poll-dialog-question'
                        contentEditable
                        suppressContentEditableWarning
                        placeholder={t('QuestionHint')}
                        onChange={this.handleQuestionChange}
                        onKeyUp={this.handleQuestionKeyUp}
                        onPaste={this.handleQuestionPaste}
                    />
                    <Typography color='primary' variant='subheading'>
                        {t('PollOptions')}
                    </Typography>
                    <List classes={{ root: classes.listRoot }}>
                        {items}
                        {canAddOption && (
                            <ListItem
                                selected={false}
                                className={classes.listItem}
                                button
                                onClick={this.handleAddPollOption}>
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
                    <Button color='primary' onClick={this.handleSend}>
                        {t('Send')}
                    </Button>
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
