/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import SharedMediaBase from './SharedMediaBase';
import './SharedAudios.css';

class SharedAudios extends SharedMediaBase {
    isValidContent(content) {
        return content && content['@type'] === 'messageAudio';
    }

    getSearchFilter() {
        return { '@type': 'searchMessagesFilterAudio' };
    }

    getHeader() {
        const { t } = this.props;

        return t('AudioTitle');
    }
}

SharedAudios.propTypes = {
    chatId: PropTypes.number.isRequired,
    migratedChatId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number
};

SharedAudios.defaultProps = {
    popup: false,
    minHeight: 0
};

export default withTranslation()(SharedAudios);
