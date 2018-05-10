import React, {Component} from 'react';
import './DialogControl.css';
import TileControl from './TileControl';
import ChatStore from '../Stores/ChatStore';
import classNames from "classnames";

class DialogControl extends Component{

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chat !== this.props.chat){
            return true;
        }
        if (nextProps.isSelected !== this.props.isSelected){
            return true;
        }

        return false;
    }

    handleClick(){
        this.props.onClick(this.props.chat);
    }

    getChatContent(chat){
        if (!chat) return '[chat undefined]';
        if (!chat.last_message) return '[last_message undefined]';
        const content = chat.last_message.content;
        if (!content) return '[content undefined]';

        switch (content['@type']) {
            case 'messageText':
                return content.text.text;
            case 'messageDocument':
                return 'document';
            default:
                return '[' + content['@type'] + ']';
        }
    }

    getChatUnreadCount(chat){
        if (!chat) return null;
        if (!chat.unread_count) return null;

        return chat.unread_count;
    }

    getChatMuteFor(chat){
        if (!chat) return 0;
        if (!chat.notification_settings) return 0;
        if (chat.notification_settings['@type'] !== 'notificationSettings') return 0;
        if (!chat.notification_settings.mute_for) return 0;

        return chat.notification_settings.mute_for;
    }

    render(){
        const chat = this.props.chat;
        const content = this.getChatContent(chat);
        const title = chat.title || 'Deleted account';

        const dialogClassName = this.props.isSelected ? 'dialog-active' : 'dialog';

        const unreadCount = this.getChatUnreadCount(chat);
        const muteFor = this.getChatMuteFor(chat);
        const muteForClassName = muteFor > 0 ? 'dialog-badge-muted' : '';

        return (
            <div className={dialogClassName}>
                <div className='dialog-wrapper' onMouseDown={() => this.handleClick()}>
                    <TileControl chat={this.props.chat}/>
                    <div className='dialog-content-wrap'>
                        <div className='dialog-title'>{title}</div>
                        <div className='dialog-content'><span>{content}</span></div>
                        {/*<div className='dialog-date'>{this.props.chat.order}:{this.props.chat.last_message.date}</div>*/}
                    </div>
                    <div className='dialog-badge-wrapper'>
                        <div className='dialog-badge-header'/>
                        {unreadCount ? <div className={classNames(muteForClassName, 'dialog-badge')}>{unreadCount}</div> : (chat.is_pinned ? <i className='dialog-pinned'/> : null) }
                    </div>
                </div>
            </div>
        );
    }
}

export default DialogControl;