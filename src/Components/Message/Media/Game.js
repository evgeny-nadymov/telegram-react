/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core';
import Animation from './Animation';
import { accentStyles } from '../../Theme';
import { getFormattedText } from '../../../Utils/Message';
import { getFitSize, getSize } from '../../../Utils/Common';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import './Game.css';

const styles = theme => ({
    ...accentStyles(theme)
});

class Game extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateGameBlob', this.onClientUpdateGameBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateGameBlob', this.onClientUpdateGameBlob);
    }

    onClientUpdateGameBlob = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.forceUpdate();
        }
    };

    getContent = () => {
        const { chatId, messageId, size, displaySize, openMedia } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { game } = content;
        if (!game) return null;

        const { photo, animation } = game;

        if (animation) {
            return <Animation chatId={chatId} messageId={messageId} animation={animation} openMedia={openMedia} />;
        } else if (photo) {
            let src = '';
            let fitPhotoSize = {
                width: 0,
                height: 0
            };
            const photoSize = getSize(photo.sizes, size);
            if (photoSize) {
                fitPhotoSize = getFitSize(photoSize, displaySize);
                if (fitPhotoSize) {
                    const file = photoSize.photo;
                    const blob = FileStore.getBlob(file.id) || file.blob;
                    src = FileStore.getBlobUrl(blob);
                }
            }

            return (
                <div className='game-photo' style={fitPhotoSize} onClick={openMedia}>
                    <img className='photo-img' style={fitPhotoSize} src={src} alt='' />
                </div>
            );
        }

        return null;
    };

    render() {
        const { classes, chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { game } = content;
        if (!game) return null;

        const { title, text, description } = game;
        const formattedText = getFormattedText(text);

        return (
            <div className='game'>
                <div className={classNames('game-border', classes.accentBackgroundLight)} />
                <div className='game-wrapper'>
                    {title && <div className={classNames('game-title', classes.accentColorDark)}>{title}</div>}
                    {formattedText && <div className='game-text'>{formattedText}</div>}
                    {description && <div className='game-description'>{description}</div>}
                    {this.getContent()}
                </div>
            </div>
        );
    }
}

Game.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number,
    openMedia: PropTypes.func
};

Game.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default withStyles(styles)(Game);
