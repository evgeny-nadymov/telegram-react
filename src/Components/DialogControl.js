import React, {Component} from 'react';
import './DialogControl.css';
import TileControl from './TileControl';
import ChatStore from '../Stores/ChatStore';
import classNames from 'classnames';
import DialogContentControl from './DialogContentControl';
import {
    getChatUnreadMessageIcon,
    getChatUnreadCount,
    getChatUnreadMentionCount,
    getChatMuteFor,
    getLastMessageDate
} from '../Utils/Chat';

class DialogControl extends Component{

    constructor(props){
        super(props);

        const chat = ChatStore.get(this.props.chatId);

        this.state={
            chat : chat
        };

        this.onUpdate = this.onUpdate.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    componentDidMount(){
        ChatStore.on('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.on('updateChatNotificationSettings', this.onUpdate);
        ChatStore.on('updateChatPhoto', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateChatReadOutbox', this.onUpdate);
        //ChatStore.on('updateChatReplyMarkup', this.onUpdate);
        ChatStore.on('updateChatTitle', this.onUpdate);
        ChatStore.on('updateChatUnreadMentionCount', this.onUpdate);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.removeListener('updateChatNotificationSettings', this.onUpdate);
        ChatStore.removeListener('updateChatPhoto', this.onUpdate);
        ChatStore.removeListener('updateChatReadInbox', this.onUpdate);
        ChatStore.removeListener('updateChatReadOutbox', this.onUpdate);
        //ChatStore.removeListener('updateChatReplyMarkup', this.onUpdate);
        ChatStore.removeListener('updateChatTitle', this.onUpdate);
        ChatStore.removeListener('updateChatUnreadMentionCount', this.onUpdate);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }
        if (nextProps.isSelected !== this.props.isSelected){
            return true;
        }

        return false;
    }

    onUpdate(update) {
        if (!update.chat_id) return;
        if (update.chat_id !== this.props.chatId) return;

        this.forceUpdate();
        //const chat = ChatStore.get(update.chat_id);
        //this.setState({ chat: chat });
    }

    handleSelect(){
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        this.props.onSelect(chat);
    }

    render(){
        const chat = ChatStore.get(this.props.chatId);

        const title = chat.title || 'Deleted account';
        const date = getLastMessageDate(chat);
        const unreadMessageIcon = getChatUnreadMessageIcon(chat);
        const unreadCount = getChatUnreadCount(chat);
        const unreadMentionCount = getChatUnreadMentionCount(chat);
        const showUnreadCount = unreadCount > 1 || (unreadCount === 1 && unreadMentionCount < 1);
        const muteFor = getChatMuteFor(chat);
        const muteForClassName = muteFor > 0 ? 'dialog-badge-muted' : '';

        return (
            <div className={this.props.isSelected ? 'dialog-active' : 'dialog'}>
                <div className='dialog-wrapper' onMouseDown={this.handleSelect}>
                    <TileControl chat={chat}/>
                    <div className='dialog-content-wrap'>
                        <div className='dialog-title-wrapper'>
                            <div className='dialog-title'>{title}</div>
                            {/*<div className='dialog-title'>{chat.id}</div>*/}
                            {date && <div className='dialog-date'>{date}</div>}
                        </div>
                        <div className='dialog-content-wrapper'>
                            <DialogContentControl chatId={this.props.chatId}/>
                            {/*<div className='dialog-content'><span>{content}</span></div>*/}
                            {unreadMessageIcon && <i className='dialog-unread'/>}
                            {unreadMentionCount && <div className='dialog-badge'><div className='dialog-badge-mention'>@</div></div> }
                            {showUnreadCount
                                ? <div className={classNames(muteForClassName, 'dialog-badge')}><div className='dialog-badge-text'>{unreadCount}</div></div>
                                : (chat.is_pinned && !unreadMessageIcon ? <i className='dialog-pinned'/> : null) }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DialogControl;