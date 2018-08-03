import React, {Component} from 'react';
import './DialogControl.css';
import TileControl from './TileControl';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import classNames from 'classnames';
import dateFormat from 'dateformat';
import DialogContentControl from "./DialogContentControl";
import TdLibController from "../Controllers/TdLibController";

class DialogControl extends Component{

    constructor(props){
        super(props);

        this.state={
            'notificationSettings': this.props.chat.notification_settings
        };

        this.onUpdate = this.onUpdate.bind(this);
    }

    componentDidMount(){
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chat !== this.props.chat){
            return true;
        }
        if (nextProps.isSelected !== this.props.isSelected){
            return true;
        }
        if (nextState.notificationSettings !== this.state.notificationSettings){
            return true;
        }

        return false;
    }

    onUpdate(update) {

        switch (update['@type']) {
            case 'updateNotificationSettings':
                this.onUpdateNotificationSettings(update.scope, update.notification_settings);
                break;
            default:
                break;
        }
    }

    onUpdateNotificationSettings(scope, notification_settings){
        if (!scope) return;
        if (!notification_settings) return;
        if (scope['@type'] !== 'notificationSettingsScopeChat') return;
        if (!this.props.chat) return;
        if (this.props.chat.id !== scope.chat_id) return;

        this.props.chat['notification_settings'] = notification_settings;

        this.setState({'notificationSettings' : this.props.chat.notification_settings});
    }

    handleClick(){
        this.props.onClick(this.props.chat);
    }

    getChatSender(chat){
        if (!chat) return null;
        if (!chat.last_message) return null;
        if (!chat.last_message.sender_user_id) return null;

        return UserStore.get(chat.last_message.sender_user_id);
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

    getChatUnreadMessageIcon(chat){
        if (!chat) return false;
        if (!chat.last_message) return false;

        return chat.last_message.is_outgoing && chat.last_message.id > chat.last_read_outbox_message_id;
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
        if (chat.draft_message) return null;

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
        const sender = this.getChatSender(chat);
        const title = chat.title || 'Deleted account';
        const date = this.getDate(chat);

        const dialogClassName = this.props.isSelected ? 'dialog-active' : 'dialog';

        const unreadMessageIcon = this.getChatUnreadMessageIcon(chat);
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
                            {date && <div className='dialog-date'>{date}</div>}
                        </div>
                        <div className='dialog-content-wrapper'>
                            <DialogContentControl chat={this.props.chat} sender={sender} content={content}/>
                            {/*<div className='dialog-content'><span>{content}</span></div>*/}
                            {unreadMessageIcon && <i className='dialog-unread'/>}
                            {unreadMentionCount && <div className='dialog-badge'><div className='dialog-badge-mention'>@</div></div> }
                            {showUnreadCount ? <div className={classNames(muteForClassName, 'dialog-badge')}><div className='dialog-badge-text'>{unreadCount}</div></div> : (chat.is_pinned && !unreadMessageIcon ? <i className='dialog-pinned'/> : null) }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DialogControl;