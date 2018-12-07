/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './WebPage.css'
import FileStore from '../../../Stores/FileStore';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import { getFitSize, getSize } from '../../../Utils/Common';

class WebPage extends React.Component {
    componentDidMount() {
        this.mount = true;
        // FileStore.on('updateFile', this.onUpdateFile);
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdateWebPageBlob);
    }

    componentWillUnmount() {
        // FileStore.removeListener('updateFile', this.onUpdateFile);
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdateWebPageBlob);
        this.mount = false;
    }

    onClientUpdateWebPageBlob = (update) => {
        const { message } = this.props;
        if (!message) return;
        const { chatId, messageId } = update;

        if (message.chat_id === chatId
            && message.id === messageId) {
            this.forceUpdate();
        }
    };

    // onUpdateFile = (update) => {
    //     const { file } = update;
    //
    //     if (this.photoSize
    //         && this.photoSize.photo
    //         && this.photoSize.photo.id === file.id){
    //
    //         file.blob = this.photoSize.photo.blob;
    //         this.photoSize.photo = file;
    //
    //         this.forceUpdate();
    //     }
    // };


    getSiteName = (webPage) => {
        if (!webPage) return null;

        return webPage.site_name;
    };

    getTitle = (webPage) => {
        if (!webPage) return null;

        return webPage.title;
    };

    getDescription = (webPage) => {
        if (!webPage) return null;

        return webPage.description;
    };

    getUrl = (webPage) => {
        if (!webPage) return null;

        return webPage.url;
    };

    getPhoto = (webPage) => {
        if (!webPage) return null;

        return webPage.photo;
    };

    render() {
        const { message } = this.props;
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

        let { size, displaySize, openMedia } = this.props;
        if (!size) {
            size = PHOTO_SIZE;
        }
        if (!displaySize) {
            displaySize = PHOTO_DISPLAY_SIZE;
        }

        this.photoSize = !this.photoSize ? getSize(this.props.message.content.web_page.photo.sizes, size) : this.photoSize;
        if (!this.photoSize) return null;

        let fitPhotoSize = getFitSize(this.photoSize, displaySize);
        if (!fitPhotoSize) return null;

        let file = this.photoSize.photo;

        const blob = FileStore.getBlob(file.id) || file.blob;

        let className = 'photo-img';
        let src = '';
        try{
            src = FileStore.getBlobUrl(blob);
        }
        catch(error){
            console.log(`WebPage.render photo with error ${error}`);
        }

        return (
            <div className='web-page'>
                <div className='web-page-border'/>
                <div className='web-page-wrapper'>
                    {siteName && <div className='web-page-site-name'>{siteName}</div>}
                    {title && <div className='web-page-title'>{title}</div>}
                    {description && <div className='web-page-description'>{description}</div>}
                    {photo &&
                        <div className='web-page-photo' style={{width: fitPhotoSize.width, height: fitPhotoSize.height}} onClick={openMedia}>
                            <a href={url} title={url} target="_blank" rel="noopener noreferrer">
                                <img className={className} width={fitPhotoSize.width} height={fitPhotoSize.height} src={src} alt=''/>
                            </a>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

WebPage.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func
};

export default WebPage;