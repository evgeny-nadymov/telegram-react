import React, {Component} from 'react';
import './MessageControl.css';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';

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

    substring(text, start, end){
        if (start < 0) start = 0;
        if (start > text.length - 1) start = text.length - 1;
        if (end < start) end = start;
        if (end > text.length) end = text.length;

        return text.substring(start, end);
    }

    getFormattedText(text){
        if (text['@type'] !== 'formattedText') return null;
        if (!text.text) return null;
        if (!text.entities) return text.text;

        let result = [];
        let index = 0;
        for (let i = 0; i < text.entities.length; i++){
            let beforeEntityText = this.substring(text.text, index, text.entities[i].offset);
            if (beforeEntityText){
                result.push(beforeEntityText);
            }

            let entityText = this.substring(text.text, text.entities[i].offset, text.entities[i].offset + text.entities[i].length);
            switch (text.entities[i].type['@type']){
                case 'textEntityTypeUrl':
                    result.push((<a href={entityText} target='_blank' rel='noopener noreferrer'>{entityText}</a>));
                    break;
                case 'textEntityTypeTextUrl':
                    result.push((<a href={text.entities[i].type.url} target='_blank' rel='noopener noreferrer'>{entityText}</a>));
                    break;
                case 'textEntityTypeBold':
                    result.push((<strong>{entityText}</strong>));
                    break;
                case 'textEntityTypeItalic':
                    result.push((<em>{entityText}</em>));
                    break;
                case 'textEntityTypeCode':
                    result.push((<code>{entityText}</code>));
                    break;
                case 'textEntityTypePre':
                    result.push((<pre><code>{entityText}</code></pre>));
                    break;
                case 'textEntityTypeMention':
                    result.push((<a href={`#/im?p=${entityText}`}>{entityText}</a>));
                    break;
                case 'textEntityTypeMentionName':
                    result.push((<a href={`#/im?p=u${text.entities[i].type.user_id}`}>{entityText}</a>));
                    break;
                case 'textEntityTypeHashtag':
                    let hashtag = entityText.length > 0 && entityText[0] === '#' ? this.substring(entityText, 1) : entityText;
                    result.push((<a href={`tg://search_hashtag?hashtag=${hashtag}`}>{entityText}</a>));
                    break;
                case 'textEntityTypeEmailAddress':
                    result.push((<a href={`mailto:${entityText}`} target='_blank' rel='noopener noreferrer'>{entityText}</a>));
                    break;
                case 'textEntityTypeBotCommand':
                    let command = entityText.length > 0 && entityText[0] === '/' ? this.substring(entityText, 1) : entityText;
                    result.push((<a href={`tg://bot_command?command=${command}&bot=`}>{entityText}</a>));
                    break;
                default :
                    result.push(entityText);
                    break;
            }

            index += beforeEntityText.length + entityText.length;
        }

        if (index < text.text.length){
            let afterEntityText = text.text.substring(index);
            if (afterEntityText){
                result.push(afterEntityText);
            }
        }

        return result;
    }

    getTitle(message){
        let from = null;
        let title = null;
        if (message.sender_user_id && message.sender_user_id !== 0){
            from = UserStore.get(message.sender_user_id);
            if (from) {
                if (from.first_name
                    && from.last_name)
                {
                    title = from.first_name + ' ' + from.last_name;
                }
                else if (from.first_name){
                    title = from.first_name;
                }
                else{
                    title = from.last_name;
                }
            }
        }
        else if (message.chat_id){
            from = ChatStore.get(message.chat_id);
            if (from) title = from.title;
        }

        return title;
    }

    getText(message){

        let text = [];//JSON.stringify(message);
        if (message.content
            && message.content['@type'] === 'messageText'
            && message.content.text
            && message.content.text['@type'] === 'formattedText'
            && message.content.text.text) {
            text = this.getFormattedText(message.content.text);
        }
        else {
            text.push('[' + message.content['@type'] + ']');//JSON.stringify(x);
            if (message.content && message.content.caption
                && message.content.caption['@type'] === 'formattedText'
                && message.content.caption.text){
                text.push("\n");
                let formattedText = this.getFormattedText(message.content.caption);
                if (formattedText){
                    text = text.concat(formattedText);
                }
            }
        }

        return text;
    }

    getDate(message){
        if (!message.date) return null;

        let date = new Date(message.date * 1000);
        let dateFormatted = date.toDateString();

        return dateFormatted;
    }

    render(){
        let message = this.props.message;
        if (!message) return (<div>[empty message]</div>);

        const messageClassName = this.props.sendingState ? 'message sending' : 'message';

        let title = this.getTitle(message);
        let text = this.getText(message);
        let date = this.getDate(message);
        return (
            <div className={messageClassName}>
                <div className='message-wrapper'>
                    <div className='message-content'>
                        <div className='message-meta'>
                            <span className='message-date'>{date}</span>
                        </div>
                        <div className='message-body'>
                            <div className='message-author'>{title}</div>
                            <div className='message-text'>{text}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MessageControl;