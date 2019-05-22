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
import { withStyles } from '@material-ui/core';
import { withTranslation } from 'react-i18next';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/es/Typography/Typography';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { borderStyle } from '../Theme';
import { POLL_OPTION_HINT_LENGTH, POLL_OPTION_LENGTH, POLL_OPTION_MAX_LENGTH } from '../../Constants';
import './PollOptionItem.css';

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

class PollOptionItem extends React.Component {
    constructor(props) {
        super(props);

        this.keys = {
            backspace: 8,
            shift: 16,
            ctrl: 17,
            alt: 18,
            delete: 46,
            // 'cmd':
            leftArrow: 37,
            upArrow: 38,
            rightArrow: 39,
            downArrow: 40
        };

        this.utils = {
            special: {},
            navigational: {},
            isSpecial(e) {
                return typeof this.special[e.keyCode] !== 'undefined';
            },
            isNavigational(e) {
                return typeof this.navigational[e.keyCode] !== 'undefined';
            }
        };

        this.utils.special[this.keys['backspace']] = true;
        this.utils.special[this.keys['shift']] = true;
        this.utils.special[this.keys['ctrl']] = true;
        this.utils.special[this.keys['alt']] = true;
        this.utils.special[this.keys['delete']] = true;

        this.utils.navigational[this.keys['upArrow']] = true;
        this.utils.navigational[this.keys['downArrow']] = true;
        this.utils.navigational[this.keys['leftArrow']] = true;
        this.utils.navigational[this.keys['rightArrow']] = true;

        this.optionTextRef = React.createRef();

        this.state = {
            remainLength: POLL_OPTION_MAX_LENGTH
        };
    }

    handleDelete = () => {
        const { option, onDelete } = this.props;
        if (!option) return;
        if (!onDelete) return;

        onDelete(option.id);
    };

    getInnerText = div => {
        const innerText = div.innerText;
        const innerHTML = div.innerHTML;

        if (innerText && innerText === '\n' && innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            div.innerHTML = '';
        }

        return innerText;
    };

    getText = () => {
        return this.getInnerText(this.optionTextRef.current);
    };

    focus = () => {
        const element = this.optionTextRef.current;
        if (element.childNodes.length > 0) {
            const range = document.createRange();
            range.setStart(element.childNodes[0], element.childNodes[0].length);
            range.collapse(true);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
        element.focus();
    };

    handleInput = event => {
        event.preventDefault();

        const node = this.optionTextRef.current;
        const length = node.dataset.length;
        const maxLength = node.dataset.maxLength;

        const innerText = this.getInnerText(node);

        this.setState({
            remainLength: length - innerText.length
        });
    };

    handleKeyDown = event => {
        const node = this.optionTextRef.current;
        const maxLength = node.dataset.maxLength;
        const innerText = this.getInnerText(node);
        const length = innerText.length;

        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = this.utils.isSpecial(event);
        const isNavigational = this.utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        switch (event.key) {
            case 'Backspace': {
                const text = this.getText();
                if (!text) {
                    const { option, onDeleteByBackspace } = this.props;
                    if (onDeleteByBackspace) {
                        onDeleteByBackspace(option.id);
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

        const innerText = this.getInnerText(node);
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
            <div className='poll-option-item'>
                <div
                    ref={this.optionTextRef}
                    id='poll-option-item-text'
                    contentEditable
                    suppressContentEditableWarning
                    placeholder={t('Option')}
                    data-length={POLL_OPTION_LENGTH}
                    data-max-length={POLL_OPTION_MAX_LENGTH}
                    onInput={this.handleInput}
                    onKeyDown={this.handleKeyDown}
                    onPaste={this.handlePaste}
                />
                <div className='poll-option-item-delete-button'>
                    <IconButton className={classes.iconButton} onClick={this.handleDelete}>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </div>
                <div className={classNames('poll-option-item-bottom-border', { [classes.borderColor]: true })} />
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

PollOptionItem.propTypes = {
    option: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDeleteByBackspace: PropTypes.func.isRequired,
    onFocusNext: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withStyles(styles),
    withTranslation(),
    withRestoreRef()
);

export default enhance(PollOptionItem);
