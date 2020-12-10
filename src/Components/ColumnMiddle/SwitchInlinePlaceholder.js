/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { closeSwitchInlinePlaceholder } from '../../Actions/Message';
import './SwitchInlinePlaceholder.css';

class SwitchInlinePlaceholder extends React.Component {

    handleClick = () => {
        closeSwitchInlinePlaceholder();
    }

    render() {
        const { t } = this.props;

        return (
            <div className='switch-inline-placeholder' onClick={this.handleClick}>
                <div className='switch-inline-text'>{t('SelectChat') + '...'}</div>
            </div>
        );
    }

}

SwitchInlinePlaceholder.propTypes = {};

export default withTranslation()(SwitchInlinePlaceholder);