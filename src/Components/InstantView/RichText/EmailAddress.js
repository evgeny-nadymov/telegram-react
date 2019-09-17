/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';

function EmailAddress(props) {
    return (
        <a href={`mailto:${props.emailAddress}`}>
            <RichText text={props.text} />
        </a>
    );
}

EmailAddress.propTypes = {
    emailAddress: PropTypes.string.isRequired,
    text: PropTypes.object.isRequired
};

export default EmailAddress;
