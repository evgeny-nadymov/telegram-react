/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from '../RichText/RichText';

function Kicker(props) {
    const { kicker } = props;
    return (
        <h6 className='kicker'>
            <RichText text={kicker} />
        </h6>
    );
}

Kicker.propTypes = {
    kicker: PropTypes.object.isRequired
};

export default Kicker;
