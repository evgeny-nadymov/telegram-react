/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import SharedMediaBase from './SharedMediaBase';
import SharedVideo from '../../Tile/SharedMedia/SharedVideo';
import { openMedia } from '../../../Utils/Message';
import './SharedVideos.css';

const styles = theme => ({
    sharedMediaList: {
        padding: '6px !important',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        alignContent: 'flex-start'
    },
    sharedMediaSearchList: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        padding: '6px !important',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        alignContent: 'flex-start'
    }
});

class SharedVideos extends SharedMediaBase {
    isValidContent(content) {
        return content && content['@type'] === 'messageVideo';
    }

    getSearchFilter() {
        return { '@type': 'searchMessagesFilterVideo' };
    }

    getHeader() {
        const { t } = this.props;

        return t('VideosTitle');
    }

    getItemTemplate(message) {
        const { migratedChatId } = this.props;
        const { chat_id, content, id } = message;

        return (
            <SharedVideo
                key={`chat_id=${chat_id}_message_id=${id}`}
                chatId={chat_id}
                messageId={id}
                video={content.video}
                openMedia={() => openMedia(chat_id, id, false)}
                showOpenMessage={chat_id !== migratedChatId}
            />
        );
    }
}

SharedVideos.propTypes = {
    chatId: PropTypes.number.isRequired,
    migratedChatId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number
};

SharedVideos.defaultProps = {
    popup: false,
    minHeight: 0
};

const enhance = compose(
    withStyles(styles),
    withTranslation()
);

export default enhance(SharedVideos);
