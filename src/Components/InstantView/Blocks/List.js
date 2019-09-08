/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from './ListItem';

function List(props) {
    return (
        <ul>
            {props.items.map(x => (
                <ListItem label={x.label} page_blocks={x.page_blocks} />
            ))}
        </ul>
    );
}

List.propTypes = {
    items: PropTypes.array.isRequired
};

export default List;
