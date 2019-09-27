/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withIV } from './IVContext';
import { getPageBlock } from '../../Utils/InstantView';
import './Article.css';

class Article extends React.PureComponent {
    render() {
        const { iv } = this.props;
        if (!iv) return null;

        const { page_blocks, is_rtl } = iv;
        if (!page_blocks) return;

        return (
            <article dir={is_rtl ? 'rtl' : 'ltr'}>{page_blocks.map((x, index) => getPageBlock(x, iv, index))}</article>
        );
    }
}

Article.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number
};

export default withIV(Article);
