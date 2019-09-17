/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getPageBlock } from '../../../Utils/InstantView';

function Cover(props) {
    return getPageBlock(props.cover);
}

Cover.propTypes = {
    cover: PropTypes.object.isRequired
};

export default Cover;
