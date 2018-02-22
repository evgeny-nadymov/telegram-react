import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './DialogDetails.css';
import InputBoxControl from "./InputBoxControl";
import MessageControl from "./MessageControl";

class DialogDetails extends Component{

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
        const x = ReactDOM.findDOMNode(this.refs.list);
        //console.log('::DialogDetails.handleScroll suppress=' + this.suppressHandleScroll + ' scrollTop=' + x.scrollTop + ' scrollHeight=' + x.scrollHeight + ' offsetHeight=' + x.offsetHeight);

        //const debug = ReactDOM.findDOMNode(this.refs.debug);
        //debug.innerHTML = 'scrollTop=' + x.scrollTop + ' scrollHeight=' + x.scrollHeight;

        if (this.suppressHandleScroll){
            this.suppressHandleScroll = false;
            return;
        }

        if (x && x.scrollTop <= 0){
            this.props.onLoadNext(x.scrollHeight);
        }
        /*if (x && (x.scrollTop + x.offsetHeight) >= x.scrollHeight){
            this.props.onLoadNext();
        }*/
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
        const messages = this.props.history.map(x => {
            return (<MessageControl key={x.id} sendingState={x.sending_state} message={x}></MessageControl>);
        });

        /*const inputBox = this.props.history.length === 0 ?
            null :
            ();*/

        return (
            <div className='details'>
                <div ref='list' className='dialogdetails-wrapper' onScroll={() => this.handleScroll()}>
                    <div className='dialogdetails-list-top'></div>
                    <div className='dialogdetails-list'>
                        {messages}
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