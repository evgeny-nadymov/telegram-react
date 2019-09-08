/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getPageBlock } from '../../../Utils/InstantView';

function ListItem(props) {
    return <li>{props.page_blocks.map(getPageBlock)}</li>;
}

ListItem.propTypes = {
    label: PropTypes.string.isRequired,
    page_blocks: PropTypes.array.isRequired
};

export default ListItem;
