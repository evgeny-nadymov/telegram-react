/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {getFitSize} from '../../../Utils/Common';
import FileStore from '../../../Stores/FileStore';
import './StickerControl.css';

class StickerControl extends React.Component {
    constructor(props){
        super(props);
    }

    /*shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chat !== this.props.chat){
            return true;
        }

        return false;
    }*/

    componentDidMount(){
        FileStore.on('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
    }

    componentWillUnmount(){
        FileStore.removeListener('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
    }

    onClientUpdateStickerBlob = (update) => {
        const { message } = this.props;
        if (!message) return;
        const { chatId, messageId } = update;

        if (message.chat_id === chatId
            && message.id === messageId) {
            this.forceUpdate();
        }
    };

    render() {
        const { message } = this.props;
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { sticker } = content;
        if (!sticker) return null;

        let file = sticker.sticker;
        if (!file) return null;

        let size = {
            width: sticker.width,
            height: sticker.height
        };

        let fitSize = getFitSize(size, 192);
        let src = '';
        try{
            src = FileStore.getBlobUrl(file.blob);
        }
        catch(error){
            console.log(`StickerControl.render sticker with error ${error}`);
        }

        return (
            <img className='sticker-img' width={fitSize.width} height={fitSize.height} src={src} alt=''/>
        );
    }
}

StickerControl.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func.isRequired
};

export default StickerControl;