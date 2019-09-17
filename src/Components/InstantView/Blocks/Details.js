/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from '../RichText/RichText';
import { getPageBlock } from '../../../Utils/InstantView';

function Details(props) {
    const { header, pageBlocks, isOpen } = props;

    return (
        <details open={isOpen}>
            <summary>
                <RichText text={header} />
            </summary>
            {pageBlocks.map(getPageBlock)}
        </details>
    );
}

Details.propTypes = {
    header: PropTypes.object.isRequired,
    pageBlocks: PropTypes.array.isRequired,
    isOpen: PropTypes.bool.isRequired
};

export default Details;
