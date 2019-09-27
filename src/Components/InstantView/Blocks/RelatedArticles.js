/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RelatedArticle from './RelatedArticle';
import RichText from '../RichText/RichText';

function RelatedArticles(props) {
    return (
        <>
            <h4>
                <RichText text={props.header} />
            </h4>
            <ul className='related-articles'>
                {props.articles.map(x => (
                    <RelatedArticle
                        key={x.url}
                        url={x.url}
                        title={x.title}
                        description={x.description}
                        photo={x.photo}
                        author={x.author}
                        publishDate={x.publish_date}
                    />
                ))}
            </ul>
        </>
    );
}

RelatedArticles.propTypes = {
    header: PropTypes.object.isRequired,
    articles: PropTypes.array.isRequired
};

export default RelatedArticles;
