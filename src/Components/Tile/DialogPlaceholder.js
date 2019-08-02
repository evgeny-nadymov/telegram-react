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
import { getChatTitle } from '../../Utils/Chat';
import './DialogPlaceholder.css';

const styles = theme => ({
    dialogPlaceholderBackground: {
        backgroundColor: theme.palette.text.secondary
    }
});

class DialogPlaceholder extends React.Component {
    render() {
        const { chatId, classes, index, showTitle } = this.props;

        let title = null;
        if (showTitle) {
            title = getChatTitle(chatId, true);
        }

        const titleWidth = `${50 + Math.sin(index) * 10}%`;
        const contentWidth = `${70 + Math.cos(index) * 10}%`;

        return (
            <div className='dialog-placeholder'>
                <div className='dialog-placeholder-wrapper'>
                    <div className={classNames('dialog-placeholder-tile', classes.dialogPlaceholderBackground)} />
                    <div className='dialog-placeholder-inner-wrapper'>
                        <div className='tile-first-row'>
                            {showTitle ? (
                                title
                            ) : (
                                <div
                                    className={classNames(
                                        'dialog-placeholder-title',
                                        classes.dialogPlaceholderBackground
                                    )}
                                    style={{ width: titleWidth }}
                                />
                            )}
                        </div>
                        <div className='tile-second-row'>
                            <div
                                className={classNames(
                                    'dialog-placeholder-content',
                                    classes.dialogPlaceholderBackground
                                )}
                                style={{ width: contentWidth }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

DialogPlaceholder.propTypes = {
    index: PropTypes.number.isRequired,
    showTitle: PropTypes.bool
};

export default withStyles(styles)(DialogPlaceholder);
