import React, {Component} from 'react';
import './DialogControl.css';
import TileControl from './TileControl';
import ChatStore from '../Stores/ChatStore';
import DialogContentControl from './DialogContentControl';
import DialogBadgeControl from './DialogBadgeControl';
import DialogTitleControl from './DialogTitleControl';
import DialogMetaControl from './DialogMetaControl';

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
        ChatStore.on('updateChatPhoto', this.onUpdate);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatPhoto', this.onUpdate);
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
        const {chatId} = this.props;
        const chat = ChatStore.get(chatId);

        return (
            <div className={this.props.isSelected ? 'dialog-active' : 'dialog'} onMouseDown={this.handleSelect}>
                <div className='dialog-wrapper'>
                    <TileControl chat={chat}/>
                    <div className='dialog-inner-wrapper'>
                        <div className='dialog-row1-wrapper'>
                            <DialogTitleControl chatId={chatId}/>
                            <DialogMetaControl chatId={chatId}/>
                        </div>
                        <div className='dialog-row2-wrapper'>
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