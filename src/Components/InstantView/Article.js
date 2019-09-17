/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getPageBlock } from '../../Utils/InstantView';
import './Article.css';

function Article(props) {
    const { content } = props;
    if (!content) return null;

    const { page_blocks } = content;
    if (!page_blocks) return;

    return <article>{page_blocks.map(getPageBlock)}</article>;
}

Article.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    content: PropTypes.object.isRequired
};

export default Article;
