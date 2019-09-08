/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Caption from './Caption';
import MediaPhoto from '../../../Components/Message/Media/Photo';

function Photo(props) {
    const { photo, caption, url } = props;

    return (
        <>
            <MediaPhoto photo={photo} style={{ margin: '0 auto' }} />
            {caption && <Caption text={caption.text} credit={caption.credit} />}
        </>
    );
}

Photo.propTypes = {
    photo: PropTypes.object.isRequired,
    caption: PropTypes.object.isRequired,
    url: PropTypes.string.isRequired
};

export default Photo;
