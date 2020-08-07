/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from '../../Utils/HOC';
import { withSaveRef } from '../../Utils/HOC';
import { withIV } from './IVContext';
import { getPageBlock } from '../../Utils/InstantView';
import './Article.css';

const articleRefs = new Map();

class Article extends React.PureComponent {
    render() {
        const { forwardedRef, iv } = this.props;
        if (!iv) return null;

        const { page_blocks, is_rtl } = iv;
        if (!page_blocks) return;

        articleRefs.clear();
        const blocks = page_blocks.map((x, index) => getPageBlock(x, iv, index, ref => { articleRefs.set(x, ref) }));

        return (
            <article ref={forwardedRef} dir={is_rtl ? 'rtl' : 'ltr'}>
                {blocks}
            </article>
        );
    }
}

Article.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number
};

const enhance = compose(
    withSaveRef(),
    withIV
);

export { articleRefs };

export default enhance(Article);
