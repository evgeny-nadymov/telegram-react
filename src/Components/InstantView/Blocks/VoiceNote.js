/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MediaVoiceNote from '../../Message/Media/VoiceNote';
import Caption from './Caption';

function VoiceNote(props) {
    const { voiceNote, block, caption, openMedia } = props;

    return (
        <figure>
            <MediaVoiceNote block={block} voiceNote={voiceNote} openMedia={openMedia} />
            <Caption text={caption.text} credit={caption.credit} />
        </figure>
    );
}

VoiceNote.propTypes = {
    block: PropTypes.object.isRequired,
    voiceNote: PropTypes.object,
    caption: PropTypes.object.isRequired,
    openMedia: PropTypes.func
};

export default VoiceNote;