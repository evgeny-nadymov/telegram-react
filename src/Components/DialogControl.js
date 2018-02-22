import React, {Component} from 'react';
import './DialogControl.css';
import TileControl from './TileControl';
import ChatStore from '../Stores/ChatStore';

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

    render(){
        const chat = this.props.chat;
        const content = this.getChatContent(chat);

        const dialogClassName = this.props.isSelected ? 'dialog-active' : 'dialog';

        return (
            <div className={dialogClassName}>
                <div className='dialog-wrapper' onMouseDown={() => this.handleClick()}>
                    <TileControl chat={this.props.chat}/>
                    <div className='dialog-content-wrap'>
                        <div className='dialog-title'>{chat.title}</div>
                        <div className='dialog-content'><span>{content}</span></div>
                        {/*<div className='dialog-date'>{this.props.chat.order}:{this.props.chat.last_message.date}</div>*/}
                    </div>
                </div>
            </div>
        );
    }
}

export default DialogControl;