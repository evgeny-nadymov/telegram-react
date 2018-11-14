/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import ListItemText from '@material-ui/core/ListItemText';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';
import { isUserBlocked } from '../../Utils/User';
import { isChannelChat, isChatMember, isGroupChat } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';

class MoreListItem extends React.Component {
    constructor(props){
        super(props);

        const { chatId } = this.props;
        this.state = {
            prevChatId: chatId,
            openMore: false
        };
    }

    static getDerivedStateFromProps(props, state){
        if (props.chatId !== state.prevChatId){

            return {
                prevChatId: props.chatId,
                openMore: false
            }
        }

        return null;
    }

    handleMoreClick = () => {
        this.setState({ openMore: !this.state.openMore });
    };

    handleSendMessage = () => {
        const selectedChatId = ChatStore.getSelectedChatId();
        const { chatId } = this.props;
        if (selectedChatId === chatId){
            //this.dialogDetails.current.scrollToBottom();
        }
        else{
            ChatStore.setSelectedChatId(chatId);
        }
    };

    handleBlock = () => {
        const { chatId } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        const { user_id } = chat.type;
        if (!user_id) return;

        TdLibController
            .send({
                '@type': isUserBlocked(user_id) ? 'unblockUser' : 'blockUser',
                user_id: user_id
            });
    };

    render() {
        const { chatId } = this.props;
        const { openMore } = this.state;

        const chat = ChatStore.get(chatId);

        const isGroup = isGroupChat(chatId);
        let isBlocked = false;
        if (!isGroup && chat.type){
            isBlocked = isUserBlocked(chat.type.user_id);
        }
        const isMember = isChatMember(chatId);
        const isChannel = isChannelChat(chatId);

        return (
            <>
                <ListItem button onClick={this.handleMoreClick}>
                    <ListItemIcon>
                        <MoreHorizIcon/>
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant='inherit' noWrap>More</Typography>}/>
                    {openMore ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={openMore} timeout='auto' unmountOnExit>
                    <List component='div' disablePadding>
                        {
                            !isGroup &&
                            <>
                                <ListItem button onClick={this.handleSendMessage}>
                                    <ListItemText inset primary={<Typography variant='inherit' noWrap>Send Message</Typography>}/>
                                </ListItem>
                                <ListItem button onClick={this.handleBlock}>
                                    <ListItemText inset primary={<Typography color='secondary' variant='inherit' noWrap>{ isBlocked? 'Unblock' : 'Block' }</Typography>}/>
                                </ListItem>
                            </>
                        }
                        {
                            isGroup && isMember &&
                            <ListItem button>
                                <ListItemText inset primary={<Typography color='secondary' variant='inherit' noWrap>{ isChannel? 'Leave Channel' : 'Delete and Exit' }</Typography>} />
                            </ListItem>
                        }
                        {
                            isGroup && !isMember &&
                            <ListItem button>
                                <ListItemText inset primary={<Typography color='secondary' variant='inherit' noWrap>Report</Typography>} />
                            </ListItem>
                        }
                    </List>
                </Collapse>
            </>
        );
    }
}

export default MoreListItem;