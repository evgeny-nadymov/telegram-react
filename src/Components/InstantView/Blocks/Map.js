/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Caption from './Caption';
import Location from '../../Message/Media/Location';
import { IV_LOCATION_HEIGHT, IV_LOCATION_WIDTH } from '../../../Constants';

function Map(props) {
    const { location, caption } = props;

    return (
        <>
            <Location width={IV_LOCATION_WIDTH} height={IV_LOCATION_HEIGHT} location={location} />
            <Caption text={caption.text} credit={caption.credit} />
        </>
    );
}

Map.propTypes = {
    location: PropTypes.object.isRequired,
    zoom: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    caption: PropTypes.object.isRequired
};

export default Map;
