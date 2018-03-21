import React, {Component} from 'react';
import './Dialogs.css';
import DialogControl from './DialogControl'
import ReactDOM from "react-dom";
import {itemsInView, throttle} from "../Utils/Common";

class Dialogs extends Component{
    constructor(props){
        super(props);

        this.handleScroll = this.handleScroll.bind(this);
        //this.throttledScroll = throttle(this.handleScrollInternal.bind(this), 1000);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chats !== this.props.chats){
            return true;
        }

        if (nextProps.selectedChat !== this.props.selectedChat){
            return true;
        }

        return false;
    }

    componentDidUpdate(){
        //let list = ReactDOM.findDOMNode(this.refs.list);
        //let items = itemsInView(list);

        //console.log(items);
    }

    handleScroll(){
        if (!this.x)
        {
            this.x = ReactDOM.findDOMNode(this.refs.list);
        }

        if (this.x && (this.x.scrollTop + this.x.offsetHeight) >= this.x.scrollHeight){
            this.props.onLoadNext();
        }
    }

    handleScrollInternal(){
        //let list = ReactDOM.findDOMNode(this.refs.list);
        //let items = itemsInView(list);

        //console.log(items);
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
                <div className='dialogs-list' ref='list' onScroll={this.handleScroll}>
                    {chats}
                </div>
            </div>
        );
    }
}

export default Dialogs;