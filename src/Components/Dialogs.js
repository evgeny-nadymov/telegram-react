import React, {Component} from 'react';
import './Dialogs.css';
import DialogControl from './DialogControl'

class Dialogs extends Component{

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chats !== this.props.chats){
            return true;
        }

        if (nextProps.selectedChat !== this.props.selectedChat){
            return true;
        }

        return false;
    }

    render(){
        const chats = this.props.chats.map(x =>
            (<DialogControl
                key={x.id}
                chat={x}
                store={this.props.store}
                client={this.props.client}
                isSelected={this.props.selectedChat && this.props.selectedChat.id === x.id}
                onClick={this.props.onSelectChat}/>));

        return (
            <div className='master'>
                <div className='dialogs-list'>
                    {chats}
                </div>
            </div>
        );
    }
}

export default Dialogs;