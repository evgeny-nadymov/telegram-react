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
import Article from './Article';
import { setInstantViewContent } from '../../Actions/Client';
import './InstantViewer.css';

const styles = theme => ({
    instantViewer: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    }
});

class InstantViewer extends React.Component {
    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown, false);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown, false);
    }

    onKeyDown = event => {
        if (event.keyCode === 27) {
            setInstantViewContent(null);
        }
    };

    render() {
        const { classes, instantView } = this.props;
        console.log('[IV] InstantViewer.render', instantView);
        if (!instantView) return null;

        return (
            <div className={classNames('instant-viewer', classes.instantViewer)}>
                <Article content={instantView} />
            </div>
        );
    }
}

const enhance = compose(
    withStyles(styles),
    withTranslation()
);

export default enhance(InstantViewer);
