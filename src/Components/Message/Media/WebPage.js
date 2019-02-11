/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { getFitSize, getSize } from '../../../Utils/Common';
import { accentStyles } from '../../Theme';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './WebPage.css';

const styles = theme => ({
    ...accentStyles(theme)
});

class WebPage extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateWebPageBlob', this.onClientUpdateWebPageBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateWebPageBlob', this.onClientUpdateWebPageBlob);
    }

    onClientUpdateWebPageBlob = update => {
        const { message } = this.props;
        if (!message) return;

        const { chatId, messageId } = update;
        const { chat_id, id } = message;

        if (chat_id === chatId && id === messageId) {
            this.forceUpdate();
        }
    };

    getSiteName = webPage => {
        if (!webPage) return null;

        return webPage.site_name;
    };

    getTitle = webPage => {
        if (!webPage) return null;

        return webPage.title;
    };

    getDescription = webPage => {
        if (!webPage) return null;

        return webPage.description;
    };

    getUrl = webPage => {
        if (!webPage) return null;

        return webPage.url;
    };

    getPhoto = webPage => {
        if (!webPage) return null;

        return webPage.photo;
    };

    render() {
        const { classes, message, size, displaySize, openMedia } = this.props;
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { web_page } = content;
        if (!web_page) return null;

        const siteName = this.getSiteName(web_page);
        const title = this.getTitle(web_page);
        const description = this.getDescription(web_page);
        const photo = this.getPhoto(web_page);
        const url = this.getUrl(web_page);

        let src = '';
        let fitPhotoSize = {
            width: 0,
            height: 0
        };
        if (photo) {
            const photoSize = getSize(photo.sizes, size);
            if (photoSize) {
                fitPhotoSize = getFitSize(photoSize, displaySize);
                if (fitPhotoSize) {
                    const file = photoSize.photo;
                    const blob = FileStore.getBlob(file.id) || file.blob;

                    try {
                        src = FileStore.getBlobUrl(blob);
                    } catch (error) {
                        console.log(`WebPage.render photo with error ${error}`);
                    }
                }
            }
        }

        return (
            <div className='web-page'>
                <div className={classNames('web-page-border', classes.accentBackgroundLight)} />
                <div className='web-page-wrapper'>
                    {siteName && (
                        <div className={classNames('web-page-site-name', classes.accentColorDark)}>{siteName}</div>
                    )}
                    {title && <div className='web-page-title'>{title}</div>}
                    {description && <div className='web-page-description'>{description}</div>}
                    {photo && (
                        <div className='web-page-photo' style={fitPhotoSize} onClick={openMedia}>
                            <a href={url} title={url} target='_blank' rel='noopener noreferrer'>
                                <img className='photo-img' style={fitPhotoSize} src={src} alt='' />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

WebPage.propTypes = {
    message: PropTypes.object.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number,
    openMedia: PropTypes.func
};

WebPage.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default withStyles(styles)(WebPage);
