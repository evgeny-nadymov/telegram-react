/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MediaAudio from '../../Message/Media/Audio';
import { PHOTO_DISPLAY_SIZE } from '../../../Constants';
import Caption from './Caption';

function Audio(props) {
    const { audio, caption, openMedia } = props;

    return (
        <>
            <MediaAudio audio={audio} displaySize={PHOTO_DISPLAY_SIZE} openMedia={openMedia} />
            <Caption text={caption.text} credit={caption.credit} />
        </>
    );
}

Audio.propTypes = {
    audio: PropTypes.object,
    caption: PropTypes.object.isRequired,
    openMedia: PropTypes.func
};

export default Audio;
