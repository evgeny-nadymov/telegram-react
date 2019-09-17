/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Caption from './Caption';
import { getPageBlock } from '../../../Utils/InstantView';

function Collage(props) {
    const { pageBlocks, caption } = props;

    return (
        <div className='collage'>
            {pageBlocks.map(getPageBlock)}
            {caption && <Caption text={caption.text} credit={caption.credit} />}
        </div>
    );
}

Collage.propTypes = {
    pageBlocks: PropTypes.array.isRequired,
    caption: PropTypes.object.isRequired
};

export default Collage;
