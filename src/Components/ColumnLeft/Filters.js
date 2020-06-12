/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import FilterStore from '../../Stores/FilterStore';
import TdLibController from '../../Controllers/TdLibController';
import './Filters.css';

class Filters extends React.Component {
    constructor(props) {
        super(props);

        this.filterRef = new Map();
        this.filtersRef = React.createRef();
        this.filterSelectionRef = React.createRef();

        this.state = {
            filters: FilterStore.filters,
            chatList: FilterStore.chatList
        }
    }

    componentDidMount() {
        FilterStore.on('updateChatFilters', this.onUpdateChatFilters);
        FilterStore.on('clientUpdateChatList', this.onClientUpdateChatList);

        this.setSelection();
    }

    componentWillUnmount() {
        FilterStore.off('updateChatFilters', this.onUpdateChatFilters);
        FilterStore.off('clientUpdateChatList', this.onClientUpdateChatList);
    }

    setSelection() {
        const { chatList, filters } = this.state;

        let item = null;
        let left = 9;
        if (chatList['@type'] === 'chatListMain') {
            const main = this.filterRef.get('chatListMain');
            if (main){
                item = main;
                left += 7;
            }
        } else if (chatList['@type'] === 'chatListFilter') {
            const main = this.filterRef.get('chatListMain');
            if (main){
                left += main.scrollWidth;
            }
            for (let i = 0; i < filters.length; i++) {
                const filter = this.filterRef.get('chatListFilter_id=' + filters[i].id);
                if (filters[i].id === chatList.chat_filter_id) {
                    item = filter;
                    left += 7;
                    break;
                } else {
                    left += filter.scrollWidth;
                }
            }
        }
        if (!item) return;

        const filterSelection = this.filterSelectionRef.current;
        if (filterSelection) {
            filterSelection.style.cssText = `left: ${left}px; width: ${item.scrollWidth - 14}px`;
        }

        if (item){
            item.scrollIntoView({ behavior: 'smooth' });
        }
    }

    onUpdateChatFilters = update => {
        const { chatList } = this.state;
        const { filters } = FilterStore;

        this.setState({
            filters
        }, () => {
            if (chatList['@type'] === 'chatListFilter' && filters.findIndex(x => x.id === chatList.chat_filter_id) === -1) {
                this.handleMainClick();
            } else {
                this.setSelection();
            }
        });
    };

    onClientUpdateChatList = update => {
        const { chatList } = FilterStore;

        this.setState({
            chatList
        }, () => {
            this.setSelection();
        });
    };

    handleMainClick = event => {
        if (event.button !== 0) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatList',
            chatList: {
                '@type': 'chatListMain'
            }
        });
    };

    handleFilterClick = (event, id) => {
        if (event.button !== 0) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatList',
            chatList: {
                '@type': 'chatListFilter',
                chat_filter_id: id
            }
        });
    };

    render() {
        const { t } = this.props;
        const { filters, chatList } = this.state;
        if (!filters) return null;
        if (!filters.length) return null;

        this.filterRef = new Map();
        return (
            <div ref={this.filtersRef} className='filters'>
                <div ref={r => this.filterRef.set('chatListMain', r)} className={classNames('filter', { 'item-selected': chatList['@type'] === 'chatListMain'})} onMouseDown={this.handleMainClick}>{t('FilterAllChats')}</div>
                {filters.map(x => <div ref={r => this.filterRef.set('chatListFilter_id=' + x.id, r)} className={classNames('filter', { 'item-selected': chatList.chat_filter_id === x.id})} key={x.id} onMouseDown={e => this.handleFilterClick(e, x.id)}>{x.title}</div>)}
                <div ref={this.filterSelectionRef} className='filter-selection'/>
            </div>
        );
    }
}

Filters.propTypes = {

};

export default withTranslation()(Filters);