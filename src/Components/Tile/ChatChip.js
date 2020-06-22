/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ChatTile from './ChatTile';
import CloseIcon from '../../Assets/Icons/Close';
import { getChatShortTitle } from '../../Utils/Chat';
import './ChatChip.css';

class ChatChip extends React.Component {
    constructor(props) {
        super(props);

        this.divRef = React.createRef();
    }

    getOffset() {
        const {
            offsetLeft: left,
            offsetTop: top,
            offsetWidth: width,
            offsetHeight: height
        } = this.divRef.current;

        return { left, top, width, height }
    }

    setStyleCSSText(text) {
        const div = this.divRef.current;
        if (!div) return;

        div.style.cssText = text;
    }

    render() {
        const { chatId, selected, onClick } = this.props;

        return (
            <div ref={this.divRef} className={classNames('chip', { 'item-selected': selected })} onClick={onClick}>
                <ChatTile chatId={chatId} small={true}/>
                <div className='chip-delete'>
                    <CloseIcon className='chip-delete-icon'/>
                </div>
                <div className='chip-text'>{getChatShortTitle(chatId)}</div>
            </div>
        )
    }
}

ChatChip.propTypes = {
    chatId: PropTypes.number,
    selected: PropTypes.bool,
    onClick: PropTypes.func
};

export default ChatChip;