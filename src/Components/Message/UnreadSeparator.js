/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import './UnreadSeparator.css';

function UnreadSeparator(props) {
    const { t } = props;

    return <div className='unread-separator'>{t('UnreadMessages')}</div>;
}

export default withTranslation()(UnreadSeparator);
