/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

function RelatedArticle(props) {
    const { author, description, publishDate } = props;

    const d = publishDate > 0 ? new Date(publishDate * 1000) : null;
    const hasAuthorDateSeparator = author && d;
    const hasAuthorDate = d || author;

    return (
        <li>
            <a href={props.url}>{props.title}</a>
            {hasAuthorDate && (
                <address>
                    {author}
                    {hasAuthorDateSeparator && ' • '}
                    {d && <time dateTime={d.toISOString()}>{dateFormat(d, 'dd mmm, yyyy')}</time>}
                </address>
            )}
            {/*{ description && (*/}
            {/*    <div>{description}</div>*/}
            {/*)}*/}
        </li>
    );
}

RelatedArticle.propTypes = {
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    photo: PropTypes.object.isRequired,
    author: PropTypes.string.isRequired,
    publishDate: PropTypes.number.isRequired
};

export default RelatedArticle;
