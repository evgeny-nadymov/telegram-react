/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import RichText from '../RichText/RichText';
import { isEmptyText } from '../../../Utils/InstantView';

function AuthorDate(props) {
    const { author, publishDate } = props;

    const hasAuthor = !isEmptyText(author);
    const hasDate = publishDate > 0;
    if (!hasAuthor && !hasDate) return null;

    const d = publishDate > 0 ? new Date(publishDate * 1000) : null;

    return (
        <address>
            {hasAuthor && (
                <a rel='author'>
                    <RichText text={author} />
                </a>
            )}
            {hasAuthor && hasDate && ' • '}
            {hasDate && <time dateTime={d.toISOString()}>{dateFormat(d, 'dd mmm, yyyy')}</time>}
        </address>
    );
}

AuthorDate.propTypes = {
    author: PropTypes.object,
    publishDate: PropTypes.number
};

export default AuthorDate;
