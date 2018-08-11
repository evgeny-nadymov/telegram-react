import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './DialogDetails.css';
import InputBoxControl from "./InputBoxControl";
import MessageControl from "./MessageControl";
import MessageGroupControl from "./MessageGroupControl";
import {debounce, itemsInView, throttle} from "../Utils/Common";
import TileControl from './TileControl';
import UserTileControl from './UserTileControl';

class DialogDetails extends Component{

    constructor(props){
        super(props);

        this.updateItemsInView = debounce(this.updateItemsInView.bind(this), 250);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.history !== this.props.history){
            /*if (nextProps.history && this.props.history && nextProps.history.length === this.props.history.length){
                for (let i = 0; i < nextProps.history.length; i++){
                    if (nextProps.history.id !== this.props.history.id){
                        return true;
                    }
                }
                return false;
            }*/

            return true;
        }

        return false;
    }

    handleScroll(){
        if (!this.x)
        {
            this.x = ReactDOM.findDOMNode(this.refs.list);
        }

        if (this.suppressHandleScroll){
            this.suppressHandleScroll = false;
            return;
        }

        if (this.x && this.x.scrollTop <= 0){
            this.props.onLoadNext(this.x.scrollHeight);
        }
        else{
            this.updateItemsInView();
        }
        /*if (x && (x.scrollTop + x.offsetHeight) >= x.scrollHeight){
            this.props.onLoadNext();
        }*/
    }

    updateItemsInView(){
        if (!this.messages) return;

        let messages = [];
        let items = itemsInView(this.refs.list, this.refs.items);
        for (let i = 0; i < items.length; i++){
            let messageControl = this.messages[items[i]];
            if (messageControl) {
                messages.push(messageControl.props.message);
            }
        }

        this.props.onUpdateItemsInView(messages);
    }

    componentDidMount() {
        if (this.props.scrollBottom)
        {
            this.scrollToBottom();
        }
    }

    componentWillUpdate() {
        const x = ReactDOM.findDOMNode(this.refs.list);
        if (x)
        {
            //console.log('::DialogDetails.componentWillUpdate scrollTop=' + x.scrollTop + ' scrollHeight=' + x.scrollHeight + ' offsetHeight=' + x.offsetHeight);
            this.previousScrollHeight = x.scrollHeight;
        }
    }

    componentDidUpdate() {
        const x = ReactDOM.findDOMNode(this.refs.list);
        //console.log('::DialogDetails.componentDidUpdate scrollTop=' + x.scrollTop + ' scrollHeight=' + x.scrollHeight + ' offsetHeight=' + x.offsetHeight);
        if (this.props.scrollBottom)
        {
            this.scrollToBottom();
        }
        else{
            /// keep scrolling position
            x.scrollTop = x.scrollHeight - this.previousScrollHeight;
        }
    }

    scrollToBottom() {
        this.suppressHandleScroll = true;
        const messagesContainer = ReactDOM.findDOMNode(this.refs.list);
        messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.offsetHeight;
    };

    render(){
        this.messages = this.props.history.map(x => {
            return (<MessageControl key={x.id} showTitle={true} sendingState={x.sending_state} message={x} onSelectChat={this.props.onSelectChat}/>);
        });

        /*let groups = [];
        if (this.props.history.length > 0){
            let currentGroup = {
                key: this.props.history[0].id,
                date: this.props.history[0].date,
                senderUserId: this.props.history[0].sender_user_id,
                messages: [this.props.history[0]]
            };

            for (let i = 1; i < this.props.history.length; i++){
                if (this.props.history[i].sender_user_id === currentGroup.senderUserId
                    && Math.abs(this.props.history[i].date - currentGroup.date) <= 10 * 60
                    && i % 20 !== 0){
                    currentGroup.key += '_' + this.props.history[i].id;
                    currentGroup.messages.push(this.props.history[i]);
                }
                else {
                    groups.push(currentGroup);
                    currentGroup = {
                        key: this.props.history[i].id,
                        date: this.props.history[i].date,
                        senderUserId: this.props.history[i].sender_user_id,
                        messages: [this.props.history[i]]
                    };
                }
            }
            groups.push(currentGroup);
        }

        this.groups = groups.map(x => {
            return (<MessageGroupControl key={x.key} senderUserId={x.senderUserId} messages={x.messages} onSelectChat={this.props.onSelectChat}/>);
        });*/

        return (
            <div className='details'>
                <div ref='list' className='dialogdetails-wrapper' onScroll={() => this.handleScroll()}>
                    <div className='dialogdetails-list-top'></div>
                    <div ref='items' className='dialogdetails-list'>
                        {this.messages}
                    </div>
                </div>
                {   this.props.selectedChat &&
                    <div className='dialogdetails-input-wrapper'>
                        <InputBoxControl
                            ref='inputBox'
                            className='dialogdetails-input'
                            currentUser={this.props.currentUser}
                            selectedChat={this.props.selectedChat}
                            onSendText={this.props.onSendText}
                            onSendFile={this.props.onSendFile}/>
                    </div>
                }
            </div>
        );
    }
}

export default DialogDetails;