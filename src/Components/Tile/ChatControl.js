/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ChatTileControl from './ChatTileControl';
import DialogTitleControl from './DialogTitleControl';
import DialogStatusControl from './DialogStatusControl';

class ChatControl extends React.Component {
    constructor(props){
        super(props);
    }

    render() {
        const { chatId } = this.props;

        return (
            <div className='dialog-wrapper'>
                <ChatTileControl chatId={chatId}/>
                <div className='dialog-inner-wrapper'>
                    <div className='dialog-row-wrapper'>
                        <DialogTitleControl chatId={chatId}/>
                    </div>
                    <div className='dialog-row-wrapper'>
                        <DialogStatusControl chatId={chatId}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default ChatControl;