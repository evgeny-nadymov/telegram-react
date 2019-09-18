/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getPageBlock } from '../../../Utils/InstantView';
import Caption from './Caption';

function Slideshow(props) {
    const { pageBlocks, caption } = props;

    return (
        <div className='slideshow'>
            {pageBlocks.map(getPageBlock)}
            <Caption text={caption.text} credit={caption.credit} />
        </div>
    );
}

Slideshow.propTypes = {
    pageBlocks: PropTypes.array.isRequired,
    caption: PropTypes.object.isRequired
};

export default Slideshow;
