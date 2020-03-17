/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ArchiveIcon from '@material-ui/icons/Archive';
import { openArchive } from '../../Actions/Client';
import './Archive.css';

class Archive extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { title, theme } = this.props;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.title !== title) {
            return true;
        }

        return false;
    }

    handleSelect = event => {
        if (event.button === 0) {
            openArchive();
        }
    };

    render() {
        const { t, title } = this.props;

        return (
            <div
                ref={this.dialog}
                className='dialog'
                onMouseDown={this.handleSelect}
                onContextMenu={this.handleContextMenu}>
                <div className='dialog-wrapper'>
                    <div className='chat-tile'>
                        <div className='archive-tile-background tile-photo'>
                            <div className='tile-saved-messages'>
                                <ArchiveIcon fontSize='default' />
                            </div>
                        </div>
                    </div>
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <div className='dialog-title'>
                                <span className='dialog-title-span'>{t('ArchivedChats')}</span>
                            </div>
                        </div>
                        <div className='tile-second-row'>
                            <div className='dialog-content'>{title}</div>
                            {/*{unread_count > 0 && (*/}
                            {/*    <div className={classNames('dialog-badge-muted', 'dialog-badge')}>*/}
                            {/*        <span className='dialog-badge-text'>{unread_count}</span>*/}
                            {/*    </div>*/}
                            {/*)}*/}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Archive.propTypes = {
    title: PropTypes.string
};

export default withTranslation()(Archive);
