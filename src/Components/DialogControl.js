import React, {Component} from 'react';
import './DialogControl.css';
import TileControl from './TileControl';
import ChatStore from '../Stores/ChatStore';
import classNames from 'classnames';
import dateFormat from 'dateformat';
import DialogContentControl from "./DialogContentControl";

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

    getChatUnreadMentionCount(chat){
        if (!chat) return null;
        if (!chat.unread_mention_count) return null;

        return chat.unread_mention_count;
    }

    getChatMuteFor(chat){
        if (!chat) return 0;
        if (!chat.notification_settings) return 0;
        if (chat.notification_settings['@type'] !== 'notificationSettings') return 0;
        if (!chat.notification_settings.mute_for) return 0;

        return chat.notification_settings.mute_for;
    }

    getDate(chat){
        if (!chat) return null;
        if (!chat.last_message) return null;
        if (!chat.last_message.date) return null;

        let date = new Date(chat.last_message.date * 1000);

        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date > yesterday){
            return dateFormat(date, 'H:MM');
        }

        let now = new Date();
        let weekStart = now.getDate() - now.getDay() + 1;
        let monday = new Date(now.setDate(weekStart));
        if (date > monday){
            return dateFormat(date, 'ddd');
        }
        //let dateFormatted = dateFormat(date, 'H:mm');// h + ':' + (m < 9 ? '0' + m : m);



        return dateFormat(date, 'd.mm.yyyy');
    }

    render(){
        const chat = this.props.chat;
        const content = this.getChatContent(chat);
        const title = chat.title || 'Deleted account';
        const date = this.getDate(chat);

        const dialogClassName = this.props.isSelected ? 'dialog-active' : 'dialog';
        const dialogDateClassName =  classNames(this.props.isSelected ? 'dialog-date-active' : null, 'dialog-date');

        const unreadCount = this.getChatUnreadCount(chat);
        const unreadMentionCount = this.getChatUnreadMentionCount(chat);
        const showUnreadCount = unreadCount > 1 || (unreadCount === 1 && unreadMentionCount < 1);
        const muteFor = this.getChatMuteFor(chat);
        const muteForClassName = muteFor > 0 ? 'dialog-badge-muted' : '';

        return (
            <div className={dialogClassName}>
                <div className='dialog-wrapper' onMouseDown={() => this.handleClick()}>
                    <TileControl chat={this.props.chat}/>
                    <div className='dialog-content-wrap'>
                        <div className='dialog-title-wrapper'>
                            <div className='dialog-title'>{title}</div>
                            <div className={dialogDateClassName}>{date}</div>
                        </div>
                        <div className='dialog-content-wrapper'>
                            <DialogContentControl chat={this.props.chat} content={content}/>
                            {/*<div className='dialog-content'><span>{content}</span></div>*/}
                            {unreadMentionCount && <div className='dialog-badge'><div className='dialog-badge-mention'>@</div></div> }
                            {showUnreadCount ? <div className={classNames(muteForClassName, 'dialog-badge')}><div className='dialog-badge-text'>{unreadCount}</div></div> : (chat.is_pinned ? <i className='dialog-pinned'/> : null) }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DialogControl;