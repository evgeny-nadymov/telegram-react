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
import SharedVoiceNote from '../../Tile/SharedMedia/SharedVoiceNote';
import { openMedia } from '../../../Utils/Message';
import './SharedVoiceNotes.css';

class SharedVoiceNotes extends SharedMediaBase {
    isValidContent(content) {
        return content && content['@type'] === 'messageVoiceNote';
    }

    getSearchFilter() {
        return { '@type': 'searchMessagesFilterVoiceNote' };
    }

    getHeader() {
        const { t } = this.props;

        return t('VoiceTitle');
    }

    hasSearch() {
        return false;
    }

    getItemTemplate(message) {
        const { migratedChatId } = this.props;
        const { chat_id, content, id } = message;

        return (
            <SharedVoiceNote
                key={`chat_id=${chat_id}_message_id=${id}`}
                chatId={chat_id}
                messageId={id}
                voiceNote={content.voice_note}
                openMedia={() => openMedia(chat_id, id, false)}
                showOpenMessage={chat_id !== migratedChatId}
            />
        );
    }
}

SharedVoiceNotes.propTypes = {
    chatId: PropTypes.number.isRequired,
    migratedChatId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number
};

SharedVoiceNotes.defaultProps = {
    popup: false,
    minHeight: 0
};

export default withTranslation()(SharedVoiceNotes);
