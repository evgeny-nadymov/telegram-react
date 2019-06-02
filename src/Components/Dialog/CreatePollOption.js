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
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/es/Typography/Typography';
import { focusNode } from '../../Utils/Component';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { utils } from '../../Utils/Key';
import { borderStyle } from '../Theme';
import { POLL_OPTION_HINT_LENGTH, POLL_OPTION_LENGTH, POLL_OPTION_MAX_LENGTH } from '../../Constants';
import TdLibController from '../../Controllers/TdLibController';
import './CreatePollOption.css';

const styles = theme => ({
    iconButton: {
        padding: 4
    },
    counterRoot: {
        position: 'absolute',
        right: 24,
        bottom: 6,
        minWidth: 28,
        userSelect: 'none'
    },
    ...borderStyle(theme)
});

class CreatePollOption extends React.Component {
    constructor(props) {
        super(props);

        this.optionTextRef = React.createRef();

        this.state = {
            remainLength: POLL_OPTION_MAX_LENGTH
        };
    }

    getText = () => {
        return this.optionTextRef.current.innerText;
    };

    focus = (toEnd = false) => {
        const node = this.optionTextRef.current;

        focusNode(node, toEnd);
    };

    handleDelete = () => {
        const { option, onDelete } = this.props;
        if (!option) return;
        if (!onDelete) return;

        onDelete(option.id);
    };

    handleInput = event => {
        const { option } = this.props;

        event.preventDefault();

        const node = this.optionTextRef.current;
        const length = node.dataset.length;
        const maxLength = node.dataset.maxLength;
        const text = this.getText();

        this.setState({
            remainLength: length - text.length
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdatePollOption',
            id: option.id,
            text
        });
    };

    handleKeyDown = event => {
        const node = this.optionTextRef.current;
        const maxLength = node.dataset.maxLength;
        const innerText = this.getText();
        const length = innerText.length;

        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        switch (event.key) {
            case 'Backspace': {
                const text = this.getText();
                if (!text) {
                    const { option, onDelete } = this.props;
                    if (onDelete) {
                        onDelete(option.id, true);
                    }

                    event.preventDefault();
                    return false;
                }

                break;
            }
            case 'Enter': {
                const { option, onFocusNext } = this.props;
                if (option && onFocusNext) {
                    onFocusNext(option.id);
                }

                event.preventDefault();
                return false;
            }
            case 'ArrowUp': {
                const selection = window.getSelection();
                if (!selection) break;
                if (!selection.isCollapsed) break;

                const firstChild = node.childNodes && node.childNodes.length > 0 ? node.childNodes[0] : null;

                if (!firstChild || (selection.anchorNode === firstChild && !selection.anchorOffset)) {
                    const { option, onFocusPrev } = this.props;
                    if (onFocusPrev) {
                        onFocusPrev(option.id);
                    }

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
                    const { option, onFocusNext } = this.props;
                    if (onFocusNext) {
                        onFocusNext(option.id);
                    }

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

        const node = this.optionTextRef.current;
        const maxLength = node.dataset.maxLength;

        const selection = window.getSelection();
        const selectionString = selection ? selection.toString() : '';

        const innerText = this.getText();
        if (innerText.length - selection.length >= maxLength) return;

        let pasteText = event.clipboardData.getData('text/plain');
        if (!pasteText) return;

        pasteText = pasteText.replace('\r\n', '\n').replace('\n', ' ');

        if (innerText.length - selectionString.length + pasteText.length > maxLength) {
            pasteText = pasteText.substr(0, maxLength - innerText.length + selectionString.length);
        }
        document.execCommand('insertHTML', false, pasteText);
    };

    render() {
        const { classes, t } = this.props;
        const { remainLength } = this.state;

        return (
            <div className='create-poll-option'>
                <div
                    ref={this.optionTextRef}
                    id='create-poll-option-text'
                    contentEditable
                    suppressContentEditableWarning
                    placeholder={t('Option')}
                    data-length={POLL_OPTION_LENGTH}
                    data-max-length={POLL_OPTION_MAX_LENGTH}
                    onInput={this.handleInput}
                    onKeyDown={this.handleKeyDown}
                    onPaste={this.handlePaste}
                />
                <div className='create-poll-option-delete-button'>
                    <IconButton className={classes.iconButton} onClick={this.handleDelete}>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </div>
                <div className={classNames('create-poll-option-bottom-border', { [classes.borderColor]: true })} />
                {remainLength <= POLL_OPTION_LENGTH - POLL_OPTION_HINT_LENGTH && (
                    <Typography
                        align='center'
                        className={classes.counterRoot}
                        color={remainLength >= 0 ? 'textSecondary' : 'error'}
                        variant='subtitle1'>
                        {remainLength}
                    </Typography>
                )}
            </div>
        );
    }
}

CreatePollOption.propTypes = {
    option: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired,
    onFocusPrev: PropTypes.func.isRequired,
    onFocusNext: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withStyles(styles),
    withTranslation(),
    withRestoreRef()
);

export default enhance(CreatePollOption);
