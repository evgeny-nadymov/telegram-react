/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import LocalizationStore from '../../Stores/LocalizationStore';
import './DayMeta.css';

class DayMeta extends React.Component {
    componentDidMount() {
        LocalizationStore.on('clientUpdateLanguageChange', this.onClientUpdateLanguage);
    }

    componentWillUnmount() {
        LocalizationStore.off('clientUpdateLanguageChange', this.onClientUpdateLanguage);
    }

    onClientUpdateLanguage = () => {
        this.forceUpdate();
    };

    render() {
        const { date, i18n } = this.props;

        const showYear = new Date(date * 1000) < new Date().setMonth(new Date().getMonth() - 3);
        const options = showYear
            ? {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
              }
            : {
                  day: 'numeric',
                  month: 'long'
              };

        return (
            <div className='day-meta'>
                <div className='day-meta-wrapper'>
                    <div>{new Date(date * 1000).toLocaleDateString([i18n.language], options)}</div>
                </div>
            </div>
        );
    }
}

DayMeta.propTypes = {
    date: PropTypes.number.isRequired
};

export default withTranslation()(DayMeta);
