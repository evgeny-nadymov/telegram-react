/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from '../RichText/RichText';
import { getHorizontalAlignment, getVerticalAlignment, isEmptyText } from '../../../Utils/InstantView';

function TableCell(props) {
    const { text, isHeader, colspan, rowspan, align, valign } = props;
    if (isEmptyText(text)) return null;

    const attributes = {
        colSpan: colspan,
        rowSpan: rowspan,
        align: getHorizontalAlignment(align),
        valign: getVerticalAlignment(valign)
    };

    const content = <RichText text={text} />;

    return isHeader ? <th {...attributes}>{content}</th> : <td {...attributes}>{content}</td>;
}

TableCell.propTypes = {
    text: PropTypes.object.isRequired,
    isHeader: PropTypes.bool.isRequired,
    colspan: PropTypes.number.isRequired,
    rowspan: PropTypes.number.isRequired,
    align: PropTypes.object.isRequired,
    valign: PropTypes.object.isRequired
};

export default TableCell;
