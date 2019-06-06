/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import AppInactiveControl from './Additional/AppInactiveControl';
import Footer from './Footer';

const styles = theme => ({
    page: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    }
});

class InactivePage extends React.Component {
    render() {
        const { classes } = this.props;

        return (
            <>
                <div className='header-wrapper' />
                <div className={classNames(classes.page, 'page')}>
                    <AppInactiveControl />
                </div>
                <Footer />
            </>
        );
    }
}

InactivePage.propTypes = {};

export default withStyles(styles)(InactivePage);
