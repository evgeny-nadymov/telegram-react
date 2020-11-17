/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from '../../../Utils/HOC';
import { withSnackbar } from 'notistack';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '../../../Assets/Icons/Add';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import CloseIcon from '../../../Assets/Icons/Close';
import CreateFilter from './CreateFilter';
import Filter from '../../Tile/Filter';
import RecommendedFilter from '../../Tile/RecommendedFilter';
import SectionHeader from '../SectionHeader';
import SidebarPage from '../SidebarPage';
import { FILTER_COUNT_MAX, NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../../Constants';
import FilterStore from '../../../Stores/FilterStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Filters.css';

const RLottie = React.lazy(() => import('../../Viewer/RLottie'));

class Filters extends React.Component {

    constructor(props) {
        super(props);

        this.lottieRef = React.createRef();

        this.state = {
            openFilter: false,
            filterId: -1,
            filter: null,
            editFilter: null,
            recommendedFilters: null,
            chats: null,
            filtersMap: new Map()
        };
    }

    componentDidMount() {
        this.loadAnimationData();
        this.loadData();

        FilterStore.on('updateChatFilters', this.onUpdateChatFilters);
    }

    componentWillUnmount() {
        FilterStore.off('updateChatFilters', this.onUpdateChatFilters);
    }

    onUpdateChatFilters = update => {
        setTimeout(() => {
            this.loadData();
        }, 100);
    };

    async loadData() {
        const chats = await TdLibController.send({
            '@type': 'getChats',
            chat_list: { '@type': 'chatListMain' },
            offset_chat_id: 0,
            offset_order: '9223372036854775807',
            limit: 1000
        });

        const { filters: filterInfo } = FilterStore;
        const promises = [];
        for (let i = 0; filterInfo && i < filterInfo.length; i++) {
            promises.push(TdLibController.send({
                '@type': 'getChatFilter',
                chat_filter_id: filterInfo[i].id
            }).catch(e => null));
        }
        const filters = await Promise.all(promises);

        const filtersMap = new Map();
        for (let i = 0; filterInfo && i < filterInfo.length; i++) {
            filtersMap.set(filterInfo[i].id, filters[i]);
        }

        const recommendedFilters = await TdLibController.send({
            '@type': 'getRecommendedChatFilters'
        });

        this.setState({
            chats,
            filtersMap,
            recommendedFilters
        });
    }

    loadAnimationData = async () => {
        const { closeData } = this.state;
        if (closeData) return;

        try {
            const requests = [
                fetch('data/Folders_1.json'),
                fetch('data/Folders_2.json'),
            ];

            const results = await Promise.all(requests);

            const [data] = await Promise.all(results.map(x => x.text()));

            this.setState({ data });
        } catch (error) {
            console.error(error);
        }
    };

    handleCreateFilter = () => {
        const { t } = this.props;
        const { filters } = FilterStore;
        if (filters.length >= FILTER_COUNT_MAX) {
            this.handleScheduledAction(t('FilterCreateError'));
            return;
        }

        const filter = {
            '@type': 'chatFiler',
            title: '',
            icon_name: '',
            pinned_chat_ids: [],
            included_chat_ids: [],
            excluded_chat_ids: [],
            exclude_muted: false,
            exclude_read: false,
            exclude_archived: false,
            include_contacts: false,
            include_non_contacts: false,
            include_bots: false,
            include_groups: false,
            include_channels: false
        };

        this.setState({
            openFilter: true,
            filterId: -1,
            filter
        });
    };

    handleCloseFilter = () => {
        this.setState({
            openFilter: false,
            filterId: -1,
            filter: null
        })
    };

    handleEditFilter = async info => {
        const filter = await TdLibController.send({
            '@type': 'getChatFilter',
            chat_filter_id: info.id
        });

        if (!filter) return;

        this.setState({
            openFilter: true,
            filterId: info.id,
            filter
        })
    };

    handleDone = filter => {
        const { filterId } = this.state;

        this.handleCloseFilter();
        if (!filter) return;

        if (filterId !== -1) {
            TdLibController.send({
                '@type': 'editChatFilter',
                chat_filter_id: filterId,
                filter
            });
        } else {
            TdLibController.send({
                '@type': 'createChatFilter',
                filter
            });
        }
    };

    handleAnimationClick = () => {
        const lottie = this.lottieRef.current;
        if (!lottie) return;
        if (!lottie.isPaused) return;

        lottie.play();
    };

    handleScheduledAction = message => {
        const { enqueueSnackbar, closeSnackbar } = this.props;

        const snackKey = enqueueSnackbar(message, {
            autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
            preventDuplicate: true,
            action: [
                <IconButton
                    key='close'
                    aria-label='Close'
                    color='inherit'
                    className='notification-close-button'
                    onClick={() => closeSnackbar(snackKey)}>
                    <CloseIcon />
                </IconButton>
            ]
        });
    };

    render() {
        const { t, onClose } = this.props;
        const { recommendedFilters, openFilter, filter, filterId, data, chats, filtersMap } = this.state;
        const { filters } = FilterStore;

        const hasFilters = filters && filters.length > 0;
        const hasRecommendedFilters = recommendedFilters
            && recommendedFilters.chat_filters.length > 0
            && (!filters || filters.length < FILTER_COUNT_MAX);

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('FilterAvailableTitle')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='sidebar-page-section filters-create'>
                        <div className='filters-create-animation'>
                            { data && (
                                <React.Suspense fallback={null}>
                                    <RLottie
                                        ref={this.lottieRef}
                                        options={{
                                            width: 80,
                                            height: 80,
                                            autoplay: true,
                                            loop: false,
                                            fileId: 'filters',
                                            stringData: data
                                        }}
                                        onClick={this.handleAnimationClick}
                                    />
                                </React.Suspense>
                            )}
                        </div>

                        <div className='filters-create-hint'>{t('CreateNewFilterInfo')}</div>
                        <Button className='filters-create-button' color='primary' variant='contained' disableElevation startIcon={<AddIcon/>} onClick={this.handleCreateFilter}>
                            {t('CreateNewFilter')}
                        </Button>
                    </div>
                    { hasFilters && (
                        <>
                            <div className='sidebar-page-section-divider' />
                            <div className='sidebar-page-section'>
                                <SectionHeader>{t('Filters')}</SectionHeader>
                                {(filters || []).map(x => (<Filter key={x.id} info={x} filter={filtersMap.get(x.id)} chats={chats} onEdit={() => this.handleEditFilter(x)}/>))}
                            </div>
                        </>
                    )}
                    { hasRecommendedFilters && (
                        <>
                            <div className='sidebar-page-section-divider' />
                            <div className='sidebar-page-section'>
                                <SectionHeader>{t('FilterRecommended')}</SectionHeader>
                                {recommendedFilters.chat_filters.map(x => (<RecommendedFilter key={x.filter.title} filter={x}/>))}
                            </div>
                        </>
                    )}
                </div>
                <SidebarPage open={openFilter} onClose={this.handleCloseFilter}>
                    <CreateFilter filter={filter} id={filterId} onDone={this.handleDone}/>
                </SidebarPage>
            </>
        );
    }
}

Filters.propTypes = {
    onClose: PropTypes.func
};

const enhance = compose(
    withTranslation(),
    withSnackbar,
);

export default enhance(Filters);