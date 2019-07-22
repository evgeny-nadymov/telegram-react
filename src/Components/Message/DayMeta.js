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
import LocalizationStore from '../../Stores/LocalizationStore';
import './DayMeta.css';

const styles = theme => ({
    dayMeta: {
        color: theme.palette.text.secondary
    }
});

class DayMeta extends React.Component {
    componentDidMount() {
        LocalizationStore.on('clientUpdateLanguageChange', this.onClientUpdateLanguage);
    }

    componentWillUnmount() {
        LocalizationStore.removeListener('clientUpdateLanguageChange', this.onClientUpdateLanguage);
    }

    onClientUpdateLanguage = () => {
        this.forceUpdate();
    };

    render() {
        const { classes, date, i18n } = this.props;

        return (
            <div className={classNames('day-meta', classes.dayMeta)}>
                {new Date(date * 1000).toLocaleDateString([i18n.language], { day: 'numeric', month: 'long' })}
            </div>
        );
    }
}

DayMeta.propTypes = {
    date: PropTypes.number.isRequired
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(DayMeta);
