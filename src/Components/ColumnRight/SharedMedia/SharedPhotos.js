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
import SharedPhoto from '../../Tile/SharedMedia/SharedPhoto';
import { openMedia } from '../../../Utils/Message';
import './SharedPhotos.css';

class SharedPhotos extends SharedMediaBase {
    getListClassName() {
        return 'shared-photos-list';
    }

    getSearchListClassName() {
        return 'shared-photos-search-list';
    }

    isValidContent(content) {
        return content && content['@type'] === 'messagePhoto';
    }

    getSearchFilter() {
        return { '@type': 'searchMessagesFilterPhoto' };
    }

    getHeader() {
        const { t } = this.props;

        return t('PhotosTitle');
    }

    getItemTemplate(message) {
        const { migratedChatId } = this.props;
        const { chat_id, content, id } = message;

        return (
            <SharedPhoto
                key={`chat_id=${chat_id}_message_id=${id}`}
                chatId={chat_id}
                messageId={id}
                photo={content.photo}
                openMedia={() => openMedia(chat_id, id, false)}
                showOpenMessage={chat_id !== migratedChatId}
            />
        );
    }
}

SharedPhotos.propTypes = {
    chatId: PropTypes.number.isRequired,
    migratedChatId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number
};

SharedPhotos.defaultProps = {
    popup: false,
    minHeight: 0
};

export default withTranslation()(SharedPhotos);
