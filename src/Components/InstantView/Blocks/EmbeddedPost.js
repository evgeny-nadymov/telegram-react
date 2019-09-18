/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Caption from './Caption';
import { getPageBlock } from '../../../Utils/InstantView';

function EmbeddedPost(props) {
    const { url, author, authorPhoto, date, pageBlocks, caption } = props;
    const hasCaption = caption && caption.text && caption.credit;
    return (
        <figure>
            {pageBlocks.map(getPageBlock)}
            {hasCaption && <Caption text={caption.text} credit={caption.credit} />}
        </figure>
    );
}

EmbeddedPost.propTypes = {
    url: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    authorPhoto: PropTypes.object.isRequired,
    date: PropTypes.number.isRequired,
    pageBlocks: PropTypes.array.isRequired,
    caption: PropTypes.object.isRequired
};

export default EmbeddedPost;
