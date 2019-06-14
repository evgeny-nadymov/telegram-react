/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import Photo from './Photo';
import Animation from './Animation';
import { accentStyles } from '../../Theme';
import { getFormattedText } from '../../../Utils/Message';
import { getFitSize, getSize } from '../../../Utils/Common';
import { getSrc } from '../../../Utils/File';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Game.css';

const styles = theme => ({
    ...accentStyles(theme)
});

class Game extends React.Component {
    getContent = () => {
        const { chatId, messageId, game, size, displaySize, openMedia } = this.props;
        if (!game) return null;

        const { photo, animation } = game;

        if (animation) {
            const animationSrc = getSrc(animation.animation);
            if (animationSrc || animation.thumbnail) {
                return <Animation chatId={chatId} messageId={messageId} animation={animation} openMedia={openMedia} />;
            }
        }

        if (photo) {
            let style = {
                width: 0,
                height: 0
            };
            const photoSize = getSize(photo.sizes, size);
            if (photoSize) {
                const fitPhotoSize = getFitSize(photoSize, displaySize);
                if (fitPhotoSize) {
                    style.width = fitPhotoSize.width;
                    style.height = fitPhotoSize.height;
                }
            }

            return <Photo chatId={chatId} messageId={messageId} photo={photo} style={style} openMedia={openMedia} />;
        }

        return null;
    };

    render() {
        const { classes, game } = this.props;
        if (!game) return null;

        const { title, text, description } = game;
        const formattedText = getFormattedText(text);

        return (
            <div className='game'>
                <div className={classNames('game-border', classes.accentBackgroundLight)} />
                <div className='game-wrapper'>
                    {title && <div className={classNames('game-title', classes.accentColorMain)}>{title}</div>}
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
    game: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,

    size: PropTypes.number,
    displaySize: PropTypes.number
};

Game.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default withStyles(styles)(Game);
