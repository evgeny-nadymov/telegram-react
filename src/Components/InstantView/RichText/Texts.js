/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';

function Texts(props) {
    return (
        <>
            {props.texts.map((x, index) => (
                <RichText key={index} text={x} />
            ))}
        </>
    );
}

Texts.propTypes = {
    texts: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Texts;
