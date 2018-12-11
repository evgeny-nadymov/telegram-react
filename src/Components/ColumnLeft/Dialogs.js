/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import classNames from 'classnames';
import DialogsHeader from './DialogsHeader';
import DialogsList from './DialogsList';
import UpdatePanel from './UpdatePanel';
import ApplicationStore from '../../Stores/ApplicationStore';
import './Dialogs.css';
import Search from './Search';
import PropTypes from 'prop-types';

class Dialogs extends Component{
    constructor(props){
        super(props);

        this.dialogsList = React.createRef();

        this.state = {
            isChatDetailsVisible: ApplicationStore.isChatDetailsVisible,
            openSearch: false
        };
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.isChatDetailsVisible !== this.state.isChatDetailsVisible){
            return true;
        }

        if (nextState.openSearch !== this.state.openSearch){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateChatDetailsVisibility', this.onUpdateChatDetailsVisibility);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateChatDetailsVisibility', this.onUpdateChatDetailsVisibility);
    }

    onUpdateChatDetailsVisibility = (update) => {
        this.setState({
            isChatDetailsVisible: ApplicationStore.isChatDetailsVisible
        })
    };

    handleHeaderClick = () => {
        this.dialogsList.current.scrollToTop();
    };

    handleSearch = (visible) => {
        this.setState({
            openSearch: visible
        })
    };

    handleSelectChat = (chatId, openSearch) => {
        const { onSelectChat } = this.props;

        onSelectChat(chatId);

        this.setState({ openSearch: openSearch });
    };

    render(){
        const { isChatDetailsVisible, openSearch } = this.state;
        
        return (
            <div className={classNames('dialogs', { 'dialogs-third-column': isChatDetailsVisible })}>
                <DialogsHeader openSearch={openSearch} onClick={this.handleHeaderClick} onSearch={this.handleSearch}/>
                <div className='dialogs-content'>
                    <DialogsList ref={this.dialogsList} onSelectChat={this.handleSelectChat}/>
                    { openSearch && <Search onSelectChat={this.handleSelectChat}/> }
                </div>
                <UpdatePanel/>
            </div>
        );
    }
}

Search.propTypes = {
    onSelectChat: PropTypes.func.isRequired
};

export default Dialogs;