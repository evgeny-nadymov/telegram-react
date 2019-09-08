/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';

class EmailAddress extends React.Component {
    render() {
        const { emailAddress, text } = this.props;

        return (
            <a href={`mailto:${emailAddress}`}>
                <RichText text={text} />
            </a>
        );
    }
}

EmailAddress.propTypes = {
    emailAddress: PropTypes.string.isRequired,
    text: PropTypes.object.isRequired
};

export default EmailAddress;
