/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import classNames from 'classnames';
import Footer from './Footer';
import NativeAppControl from './Additional/NativeAppControl';
import { borderStyle } from './Theme';

const styles = theme => ({
    page: {
        background: '#FFFFFF',
        color: '#000000'
    },
    ...borderStyle(theme)
});

class NativeAppPage extends React.Component {
    render() {
        const { classes } = this.props;

        return (
            <>
                <div className='header-wrapper' />
                <div className={classNames(classes.page, classes.borderColor, 'page')}>
                    <NativeAppControl />
                </div>
                <Footer />
            </>
        );
    }
}

export default withStyles(styles)(NativeAppPage);
