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
import { IV_PHOTO_DISPLAY_SIZE, IV_PHOTO_SIZE } from '../../../Constants';

function Photo(props) {
    const { photo, caption, url, openMedia } = props;

    return (
        <figure>
            <MediaPhoto photo={photo} size={IV_PHOTO_SIZE} displaySize={IV_PHOTO_DISPLAY_SIZE} openMedia={openMedia} />
            <Caption text={caption.text} credit={caption.credit} />
        </figure>
    );
}

Photo.propTypes = {
    photo: PropTypes.object,
    caption: PropTypes.object.isRequired,
    url: PropTypes.string.isRequired,
    openMedia: PropTypes.func
};

export default Photo;
