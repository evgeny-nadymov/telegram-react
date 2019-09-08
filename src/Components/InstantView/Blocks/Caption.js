/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from '../RichText/RichText';

function Caption(props) {
    const { text, credit } = props;
    return (
        <figcaption>
            <RichText text={text} />
            {credit && (
                <cite>
                    <RichText text={credit} />
                </cite>
            )}
        </figcaption>
    );
}

Caption.propTypes = {
    text: PropTypes.object.isRequired,
    credit: PropTypes.object.isRequired
};

export default Caption;
