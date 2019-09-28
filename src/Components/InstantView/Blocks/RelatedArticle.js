/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import SafeLink from '../../Additional/SafeLink';
import TdLibController from '../../../Controllers/TdLibController';

class RelatedArticle extends React.Component {
    handleClick = event => {
        event.preventDefault();
        event.stopPropagation();

        const { url } = this.props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateInstantViewUrl',
            url
        });
    };

    render() {
        const { author, description, publishDate, title, url } = this.props;

        const d = publishDate > 0 ? new Date(publishDate * 1000) : null;
        const hasAuthorDateSeparator = author && d;
        const hasAuthorDate = d || author;

        return (
            <li>
                <SafeLink url={url} onClick={this.handleClick}>
                    {title}
                </SafeLink>
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
}

RelatedArticle.propTypes = {
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    photo: PropTypes.object,
    author: PropTypes.string.isRequired,
    publishDate: PropTypes.number.isRequired
};

export default RelatedArticle;
