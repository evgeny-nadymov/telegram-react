/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from '../RichText/RichText';
import { getPageBlock, isEmptyText } from '../../../Utils/InstantView';

function Table(props) {
    const { caption, cells, isBordered, isStriped } = props;

    return (
        <table striped={isStriped ? '' : null} border={isBordered ? 1 : 0}>
            {!isEmptyText(caption) && (
                <caption>
                    <RichText text={caption} />
                </caption>
            )}
            {cells.map(row => {
                return <tr>{row.map(getPageBlock)}</tr>;
            })}
        </table>
    );
}

Table.propTypes = {
    caption: PropTypes.object.isRequired,
    cells: PropTypes.array.isRequired,
    isBordered: PropTypes.bool.isRequired,
    isStriped: PropTypes.bool.isRequired
};

export default Table;
