/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import ChatTileControl from './ChatTileControl';
import DialogContentControl from './DialogContentControl';
import DialogBadgeControl from './DialogBadgeControl';
import DialogTitleControl from './DialogTitleControl';
import DialogMetaControl from './DialogMetaControl';
import ChatStore from '../../Stores/ChatStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import './DialogControl.css';

class DialogControl extends Component{

    constructor(props){
        super(props);

        this.dialog = React.createRef();

        const chat = ChatStore.get(this.props.chatId);
        this.state={
            chat : chat
        };
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = (update) => {
        const { chatId } = this.props;

        if (chatId === update.previousChatId
            || chatId === update.nextChatId){
            this.forceUpdate();
        }
    };

    handleSelect = () => {
        const { chatId, onSelect } = this.props;
        if (!chatId) return;
        if (!onSelect) return;

        onSelect(chatId);
    };

    render(){
        const { chatId } = this.props;

        const currentChatId = ApplicationStore.getChatId();
        const isSelected = currentChatId === chatId;

        return (
            <div ref={this.dialog} className={isSelected ? 'dialog-active' : 'dialog'} onMouseDown={this.handleSelect}>
                <div className='dialog-wrapper'>
                    <ChatTileControl chatId={chatId}/>
                    <div className='dialog-inner-wrapper'>
                        <div className='dialog-row-wrapper'>
                            <DialogTitleControl chatId={chatId}/>
                            <DialogMetaControl chatId={chatId}/>
                        </div>
                        <div className='dialog-row-wrapper'>
                            <DialogContentControl chatId={chatId}/>
                            <DialogBadgeControl chatId={chatId}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DialogControl;