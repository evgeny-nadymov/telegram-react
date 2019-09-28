/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withIV } from '../IVContext';
import { getPageBlock } from '../../../Utils/InstantView';

function ListItem(props) {
    return <li data-before={props.label}>{props.pageBlocks.map((x, index) => getPageBlock(x, props.iv, index))}</li>;
}

ListItem.propTypes = {
    label: PropTypes.string.isRequired,
    pageBlocks: PropTypes.array.isRequired
};

export default withIV(ListItem);
