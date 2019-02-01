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
import { withNamespaces } from 'react-i18next';
import Button from '@material-ui/core/Button/Button';
import { withStyles } from '@material-ui/core';
import { borderStyle } from '../Theme';
import TdLibController from '../../Controllers/TdLibController';
import './HeaderCommand.css';

const styles = theme => ({
    buttonLeft: {
        margin: '14px 0 14px 14px',
        minWidth: '100px'
    },
    buttonRight: {
        margin: '14px 14px 14px 0',
        minWidth: '100px'
    },
    ...borderStyle(theme)
});

class HeaderCommand extends React.Component {
    handleCancel = () => {
        TdLibController.clientUpdate({ '@type': 'clientUpdateClearSelection' });
    };

    handleDelete = () => {};

    handleForward = () => {};

    render() {
        const { classes, t, count } = this.props;
        return (
            <div className={classNames(classes.borderColor, 'header-command')}>
                <Button color='primary' className={classes.buttonLeft} onClick={this.handleDelete}>
                    {`${t('Delete')} ${count}`}
                </Button>
                <Button color='primary' className={classes.buttonLeft} onClick={this.handleForward}>
                    {`${t('Forward')} ${count}`}
                </Button>
                <div className='header-command-space' />
                <Button color='primary' className={classes.buttonRight} onClick={this.handleCancel}>
                    {t('Cancel')}
                </Button>
            </div>
        );
    }
}

HeaderCommand.propTypes = {
    count: PropTypes.number
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withNamespaces()
);

export default enhance(HeaderCommand);
