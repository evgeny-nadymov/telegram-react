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
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { borderStyle } from '../Theme';
import './PollOptionItem.css';

const styles = theme => ({
    iconButton: {
        padding: 4
    },
    ...borderStyle(theme)
});

class PollOptionItem extends React.Component {
    constructor(props) {
        super(props);

        this.optionTextRef = React.createRef();
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
        this.optionTextRef.current.focus();
    };

    render() {
        const { classes, t } = this.props;

        return (
            <div className='poll-option-item'>
                <div
                    ref={this.optionTextRef}
                    id='poll-option-item-text'
                    contentEditable
                    suppressContentEditableWarning
                    placeholder={t('Option')}
                />
                <div className='poll-option-item-delete-button'>
                    <IconButton className={classes.iconButton} onClick={this.handleDelete}>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </div>
                <div className={classNames('poll-option-item-bottom-border', { [classes.borderColor]: true })} />
            </div>
        );
    }
}

PollOptionItem.propTypes = {
    option: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withStyles(styles),
    withTranslation(),
    withRestoreRef()
);

export default enhance(PollOptionItem);
