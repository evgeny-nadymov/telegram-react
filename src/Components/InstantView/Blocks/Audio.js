/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MediaAudio from '../../Message/Media/Audio';
import Caption from './Caption';

function Audio(props) {
    const { audio, block, caption, openMedia } = props;

    return (
        <figure>
            <MediaAudio block={block} audio={audio} openMedia={openMedia} />
            <Caption text={caption.text} credit={caption.credit} />
        </figure>
    );
}

Audio.propTypes = {
    block: PropTypes.object.isRequired,
    audio: PropTypes.object,
    caption: PropTypes.object.isRequired,
    openMedia: PropTypes.func
};

export default Audio;
