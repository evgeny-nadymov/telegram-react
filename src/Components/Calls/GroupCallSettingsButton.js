/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import TuneIcon from '../../Assets/Icons/Tune';
import { stopPropagation } from '../../Utils/Message';
import './GroupCallSettingsButton.css';

class GroupCallSettingsButton extends React.Component {
    render() {
        const { onClick } = this.props;

        return (
            <div className='group-call-settings-button' onMouseDown={stopPropagation} onClick={onClick}>
                <TuneIcon />
            </div>
        );
    }
}

GroupCallSettingsButton.propTypes = {
    groupCallId: PropTypes.number,
    onClick: PropTypes.func
};

export default GroupCallSettingsButton;