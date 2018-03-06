import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './DialogDetails.css';
import InputBoxControl from "./InputBoxControl";
import MessageControl from "./MessageControl";
import {itemsInView, throttle} from "../Utils/Common";

class DialogDetails extends Component{

    constructor(props){
        super(props);

        this.updateItemsInView = throttle(this.updateItemsInView.bind(this), 500);
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
            messages.push(this.messages[items[i]].props.message);
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
            return (<MessageControl key={x.id} sendingState={x.sending_state} message={x}></MessageControl>);
        });

        /*const inputBox = this.props.history.length === 0 ?
            null :
            ();*/

        return (
            <div className='details'>
                <div ref='list' className='dialogdetails-wrapper' onScroll={() => this.handleScroll()}>
                    <div className='dialogdetails-list-top'></div>
                    <div ref='items' className='dialogdetails-list'>
                        {this.messages}
                    </div>
                </div>
                <div className='dialogdetails-input-wrapper'>
                    <InputBoxControl onSendText={this.props.onSendText} onSendFile={this.props.onSendFile}/>
                </div>
            </div>
        );
    }
}

export default DialogDetails;