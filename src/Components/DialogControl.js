import React, {Component} from 'react';
import './DialogControl.css';
import ChatTileControl from './ChatTileControl';
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

        this.handleSelect = this.handleSelect.bind(this);
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

    handleSelect(){
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        this.props.onSelect(chat);
    }

    render(){
        const {chatId} = this.props;

        return (
            <div className={this.props.isSelected ? 'dialog-active' : 'dialog'} onMouseDown={this.handleSelect}>
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