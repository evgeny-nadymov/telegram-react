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
import { getFirstLetter, throttle } from '../../Utils/Common';
import AppStore from '../../Stores/ApplicationStore';
import FilterStore from '../../Stores/FilterStore';
import CacheStore from '../../Stores/CacheStore';
import TdLibController from '../../Controllers/TdLibController';
import './Filters.css';

class Filters extends React.Component {
    constructor(props) {
        super(props);

        this.filterRef = new Map();
        this.filtersRef = React.createRef();
        this.filterSelectionRef = React.createRef();

        this.state = {
            isSmallWidth: AppStore.isSmallWidth,
            filters: FilterStore.filters,
            chatList: FilterStore.chatList
        };

        this.onWindowResize = throttle(this.onWindowResize, 250);
    }

    componentDidMount() {
        window.addEventListener('resize', this.onWindowResize);
        AppStore.on('clientUpdateCacheLoaded', this.onClientUpdateCacheLoaded);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        FilterStore.on('clientUpdateChatList', this.onClientUpdateChatList);
        FilterStore.on('updateChatFilters', this.onUpdateChatFilters);

        this.setSelection();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onWindowResize);
        AppStore.off('clientUpdateCacheLoaded', this.onClientUpdateCacheLoaded);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        FilterStore.off('clientUpdateChatList', this.onClientUpdateChatList);
        FilterStore.off('updateChatFilters', this.onUpdateChatFilters);
    }

    onClientUpdateCacheLoaded = update => {
        const { filters } = this.state;
        if (filters) return;

        const { filters: cachedFilters } = CacheStore;
        if (!cachedFilters) return;

        this.setState({
            filters: cachedFilters
        }, () => {
            this.setSelection(false);
        });
    };

    onWindowResize = event => {
        this.setSelection(false);
    };

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = AppStore;
        this.setState({
            isSmallWidth
        }, () => {
            this.setSelection(false);
        });
    };

    setSelection(transition = true) {
        const { chatList, filters, isSmallWidth } = this.state;

        let item = null;
        let left = 9;
        if (chatList['@type'] === 'chatListMain') {
            const main = this.filterRef.get('chatListMain');
            if (main){
                item = main;
                left += isSmallWidth ? 0 : 7;
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
                    left += isSmallWidth ? 0 : 7;
                    break;
                } else {
                    left += filter.scrollWidth;
                }
            }
        }
        if (!item) return;

        const filterSelection = this.filterSelectionRef.current;
        if (filterSelection) {
            const transitionStyle = transition ? 'transition: left 0.15s ease, width 0.15s ease' : null;
            filterSelection.style.cssText = `left: ${left}px; width: ${item.scrollWidth - 14}px; ${transitionStyle}`;
        }

        if (item){
            item.scrollIntoView();
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
        if (event && event.button !== 0) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatList',
            chatList: {
                '@type': 'chatListMain'
            }
        });
    };

    handleFilterClick = (event, id) => {
        if (event && event.button !== 0) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatList',
            chatList: {
                '@type': 'chatListFilter',
                chat_filter_id: id
            }
        });
    };

    handleWheel = event => {
        if (!event.deltaY) {
            return;
        }

        event.currentTarget.scrollLeft += event.deltaY;
        event.stopPropagation();
    };

    render() {
        const { t } = this.props;
        const { filters, chatList, isSmallWidth } = this.state;

        // console.log('[cm] filters.render', filters);

        if (!filters) return null;
        if (!filters.length) return null;

        this.filterRef = new Map();
        return (
            <div ref={this.filtersRef} className='filters' onWheel={this.handleWheel}>
                <div
                    ref={r => this.filterRef.set('chatListMain', r)}
                    className={classNames('filter', { 'item-selected': chatList['@type'] === 'chatListMain'})}
                    onMouseDown={this.handleMainClick}
                    title={isSmallWidth ? t('FilterAllChats') : null}>
                    {isSmallWidth ? getFirstLetter(t('FilterAllChats')) : t('FilterAllChats')}
                </div>
                {filters.map(x => (
                    <div
                        key={x.id}
                        ref={r => this.filterRef.set('chatListFilter_id=' + x.id, r)}
                        className={classNames('filter', { 'item-selected': chatList.chat_filter_id === x.id})}
                        onMouseDown={e => this.handleFilterClick(e, x.id)}
                        title={isSmallWidth ? x.title : null}>
                        {isSmallWidth ? getFirstLetter(x.title) : x.title}
                    </div>))}
                <div ref={this.filterSelectionRef} className='filter-selection'/>
            </div>
        );
    }
}

Filters.propTypes = {

};

export default withTranslation()(Filters);