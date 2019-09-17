/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';

function PhoneNumber(props) {
    return (
        <a href={`tel:${props.phoneNumber}`}>
            <RichText text={props.text} />
        </a>
    );
}

PhoneNumber.propTypes = {
    phoneNumber: PropTypes.string.isRequired,
    text: PropTypes.object.isRequired
};

export default PhoneNumber;
