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

function AuthorDate(props) {
    const { author, publishDate } = props;

    const d = new Date(publishDate * 1000);

    return (
        <address>
            <a rel='author'>
                <RichText text={author} />
            </a>
            {' • '}
            <time dateTime={d.toISOString()}>{dateFormat(d, 'dd mmm, yyyy')}</time>
        </address>
    );
}

AuthorDate.propTypes = {
    author: PropTypes.object.isRequired,
    publishDate: PropTypes.number.isRequired
};

export default AuthorDate;
