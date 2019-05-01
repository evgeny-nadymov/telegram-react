/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { THUMBNAIL_BLURRED_SIZE } from '../Constants';

function isBlurredThumbnail(thumbnail) {
    if (!thumbnail) return false;

    return Math.max(thumbnail.width, thumbnail.height) < THUMBNAIL_BLURRED_SIZE;
}

function getAudioTitle(audio) {
    if (!audio) return null;

    const { file_name, title, performer } = audio;
    const trimmedTitle = title ? title.trim() : '';
    const trimmedPerformer = performer ? performer.trim() : '';

    return trimmedTitle || trimmedPerformer
        ? `${trimmedPerformer || 'Unknown Artist'} — ${trimmedTitle || 'Unknown Track'}`
        : file_name;
}

export { isBlurredThumbnail, getAudioTitle };
