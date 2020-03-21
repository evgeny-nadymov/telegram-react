/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import Wallpaper from '../../Tile/Wallpaper';
import { getSrc, loadBackgroundsContent } from '../../../Utils/File';
import FileStore from '../../../Stores/FileStore';
import TdLibController from '../../../Controllers/TdLibController';
import './ChatBackground.css';

class ChatBackground extends React.Component {
    state = {
        selectedId: -1
    };

    componentDidMount() {
        this.loadContent();
    }

    loadContent() {
        const { backgrounds } = this.props;
        if (!backgrounds) return;

        const store = FileStore.getStore();
        loadBackgroundsContent(store, backgrounds.backgrounds);
    }

    handleClick = wallpaper => {
        this.setState({
            selectedId: wallpaper.id
        });

        const { document } = wallpaper;
        if (!document) return;

        const { thumbnail, document: file } = document;
        if (!file) return;

        const src = getSrc(file);
        if (!src) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatBackground',
            wallpaper,
            src
        });
    };

    render() {
        const { t, backgrounds, onClose } = this.props;
        const { selectedId } = this.state;

        const wallpapers = backgrounds.backgrounds.filter(x => x.type['@type'] === 'backgroundTypeWallpaper');

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('ChatBackground')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content shared-media-list shared-photos-list'>
                    { wallpapers.map(x => (<Wallpaper key={x.id} wallpaper={x} isSelected={x.id === selectedId} onClick={this.handleClick}/>)) }
                </div>
            </>
        );
    }
}

ChatBackground.propTypes = {
    backgrounds: PropTypes.object
};

export default withTranslation()(ChatBackground);