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

        this.dialog = React.createRef();

        const chat = ChatStore.get(this.props.chatId);
        this.state={
            chat : chat
        };

        this.handleSelect = this.handleSelect.bind(this);
        this.onUpdateSelectedChatId = this.onUpdateSelectedChatId.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ChatStore.on('clientUpdateSelectedChatId', this.onUpdateSelectedChatId);
    }

    componentWillUnmount(){
        ChatStore.removeListener('clientUpdateSelectedChatId', this.onUpdateSelectedChatId);
    }

    onUpdateSelectedChatId(update){
        if (this.props.chatId === update.previousChatId
            || this.props.chatId === update.nextChatId){
            this.forceUpdate();
        }
    }

    componentDidUpdate(prevProps, prevState){
        // const {chatId} = this.props;
        // const selectedChatId = ChatStore.getSelectedChatId();
        // const isSelected = selectedChatId === chatId;
        //
        // if (isSelected){
        //     this.dialog.current.scrollIntoView({ block : 'end', behavior : 'smooth' });
        // }
    }

    handleSelect(){
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        this.props.onSelect(chat);
    }

    render(){
        const {chatId} = this.props;

        const selectedChatId = ChatStore.getSelectedChatId();
        const isSelected = selectedChatId === chatId;

        return (
            <div ref={this.dialog} className={isSelected ? 'dialog-active' : 'dialog'} onMouseDown={this.handleSelect}>
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