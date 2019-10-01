/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withIV } from '../IVContext';
import Caption from './Caption';
import { getPageBlock } from '../../../Utils/InstantView';
import AuthorDate from './AuthorDate';
import RichText from '../RichText/RichText';

function EmbeddedPost(props) {
    const { url, author, authorPhoto, date, pageBlocks, caption, iv } = props;

    return (
        <blockquote>
            <figure>
                {Boolean(author) && <h3>{author}</h3>}
                <AuthorDate author={null} publishDate={date} />
                {pageBlocks.map((x, index) => getPageBlock(x, iv, index))}
                <Caption text={caption.text} credit={caption.credit} />
            </figure>
        </blockquote>
    );
}

EmbeddedPost.propTypes = {
    url: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    authorPhoto: PropTypes.object,
    date: PropTypes.number.isRequired,
    pageBlocks: PropTypes.array.isRequired,
    caption: PropTypes.object.isRequired
};

export default withIV(EmbeddedPost);
