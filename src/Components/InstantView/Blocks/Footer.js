/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from '../RichText/RichText';

function Footer(props) {
    return (
        <footer>
            <RichText text={props.footer} />
        </footer>
    );
}

Footer.propTypes = {
    footer: PropTypes.object.isRequired
};

export default Footer;
