/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from '../RichText/RichText';
import { isEmptyText } from '../../../Utils/InstantView';

function Caption(props) {
    const { text, credit } = props;

    const hasText = !isEmptyText(text);
    const hastCredit = !isEmptyText(credit);
    if (!hasText && !hastCredit) return null;

    return (
        <figcaption>
            {hasText && <RichText text={text} />}
            {hastCredit && (
                <cite>
                    <RichText text={credit} />
                </cite>
            )}
        </figcaption>
    );
}

Caption.propTypes = {
    text: PropTypes.object.isRequired,
    credit: PropTypes.object.isRequired
};

export default Caption;
