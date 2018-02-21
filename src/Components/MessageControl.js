import React, {Component} from 'react';
import './MessageControl.css';

class MessageControl extends Component{

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.message !== this.props.message){
            return true;
        }

        if (nextProps.sendingState !== this.props.sendingState){
            return true;
        }

        return false;
    }

    render(){
        const messageClassName = this.props.sendingState ? 'message sending' : 'message';

        return (
            <div className={messageClassName}>
                <span>{this.props.message}</span>
            </div>
        );
    }
}

export default MessageControl;