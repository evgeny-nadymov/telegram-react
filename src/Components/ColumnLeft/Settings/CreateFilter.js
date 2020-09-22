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
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import AddIcon from '../../../Assets/Icons/Add';
import CloseIcon from '../../../Assets/Icons/Close';
import ContactsIcon from '../../../Assets/Icons/NewPrivate';
import NonContactsIcon from '../../../Assets/Icons/NonContacts';
import GroupsIcon from '../../../Assets/Icons/NewGroup';
import ChannelsIcon from '../../../Assets/Icons/NewChannel';
import MutedIcon from '../../../Assets/Icons/Mute';
import ReadIcon from '../../../Assets/Icons/ReadChats';
import ArchivedIcon from '../../../Assets/Icons/Archive';
import BotsIcon from '../../../Assets/Icons/Bots';
import RemoveIcon from '@material-ui/icons/Remove';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import DoneIcon from '../../../Assets/Icons/Done';
import EditFilterChats from './EditFilterChats';
import FilterChat from '../../Tile/FilterChat';
import FilterText from '../../Tile/FilterText';
import SectionHeader from '../SectionHeader';
import SidebarPage from '../SidebarPage';
import { isFilterValid } from '../../../Utils/Filter';
import { CHAT_SLICE_LIMIT, FILTER_TITLE_MAX_LENGTH, NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../../Constants';
import TdLibController from '../../../Controllers/TdLibController';
import './CreateFilter.css';

const RLottie = React.lazy(() => import('../../Viewer/RLottie'));

class CreateFilter extends React.Component {

    constructor(props) {
        super(props);

        this.titleRef = React.createRef();
        this.lottieRef = React.createRef();

        this.state = {
            prevFilterId: -1,
            data: null,
            openFilterChats: false,
            mode: null,
            title: '',
            error: false,
            shook: false,
            chats: [],
            limit: 0
        }
    }

    static getDerivedStateFromProps(props, state) {
        const { filter, filterId } = props;
        const { prevFilterId } = state;

        if (filter && prevFilterId !== filterId){
            return {
                prevFilterId: filterId,
                editFilter: {...filter},
                title: filter.title
            }
        }

        return null;
    }

    componentDidMount() {
        this.loadAnimationData();
    }

    loadAnimationData = async () => {
        const { closeData } = this.state;
        if (closeData) return;

        try {
            const requests = [ fetch('data/Folders_2.json') ];

            const results = await Promise.all(requests);

            const [data] = await Promise.all(results.map(x => x.text()));

            this.setState({ data });
        } catch (error) {
            console.error(error);
        }
    };

    handleDone = () => {
        const { onDone } = this.props;
        const { editFilter } = this.state;

        const title = this.titleRef.current.value.trim();
        if (!title) {
            this.titleRef.current.focus();
            this.setState({
                error: true
            })
            return;
        } else {
            this.setState({
                error: false
            })
        }

        editFilter.title = title;

        if (!isFilterValid(editFilter)) {
            this.handleScheduledAction('Please choose at least one chat for this folder.');
            return;
        }

        onDone && onDone(editFilter);
    };

    handleAnimationClick = () => {
        const lottie = this.lottieRef.current;
        if (!lottie) return;
        if (!lottie.isPaused) return;

        lottie.play();
    };

    handleDeleteIncludeContacts = () => {
        const { t } = this.props;
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, include_contacts: false };

        this.setState({
            editFilter: newEditFilter
        })

        const title = this.titleRef.current.value;
        if (title === t('FilterContacts')){
            this.setState({
                title: ''
            });
        }
    };

    handleDeleteIncludeNonContacts = () => {
        const { t } = this.props;
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, include_non_contacts: false };

        this.setState({
            editFilter: newEditFilter
        });

        const title = this.titleRef.current.value;
        if (title === t('FilterNonContacts')){
            this.setState({
                title: ''
            });
        }
    };

    handleDeleteIncludeGroups = () => {
        const { t } = this.props;
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, include_groups: false };

        this.setState({
            editFilter: newEditFilter
        });

        const title = this.titleRef.current.value;
        if (title === t('FilterGroups')){
            this.setState({
                title: ''
            });
        }
    };

    handleDeleteIncludeChannels = () => {
        const { t } = this.props;
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, include_channels: false };

        this.setState({
            editFilter: newEditFilter
        });

        const title = this.titleRef.current.value;
        if (title === t('FilterChannels')){
            this.setState({
                title: ''
            });
        }
    };

    handleDeleteIncludeBots = () => {
        const { t } = this.props;
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, include_bots: false };

        this.setState({
            editFilter: newEditFilter
        });

        const title = this.titleRef.current.value;
        if (title === t('FilterBots')){
            this.setState({
                title: ''
            });
        }
    };

    handleDeleteIncludedChat = chatId => {
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, included_chat_ids: editFilter.included_chat_ids.filter(x => x !== chatId) };

        this.setState({
            editFilter: newEditFilter
        })
    };

    handleDeleteExcludeMuted = () => {
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, exclude_muted: false };

        this.setState({
            editFilter: newEditFilter
        })
    };

    handleDeleteExcludeRead = () => {
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, exclude_read: false };

        this.setState({
            editFilter: newEditFilter
        })
    };

    handleDeleteExcludeArchived = () => {
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, exclude_archived: false };

        this.setState({
            editFilter: newEditFilter
        })
    };

    handleDeleteExcludedChat = chatId => {
        const { editFilter } = this.state;
        if (!editFilter) return;

        const newEditFilter = { ...editFilter, excluded_chat_ids: editFilter.excluded_chat_ids.filter(x => x !== chatId) };

        this.setState({
            editFilter: newEditFilter
        })
    };

    handleOpenFilterChats = async mode => {
        const result = await TdLibController.send({
            '@type': 'getChats',
            chat_list: { '@type': 'chatListMain' },
            offset_order: '9223372036854775807',
            offset_chat_id: 0,
            limit: 1000
        });

        this.setState({
            openFilterChats: true,
            mode,
            chats: result.chat_ids,
            limit: CHAT_SLICE_LIMIT
        })
    };

    setDefaultFilterTitle() {
        const { t } = this.props;
        const { editFilter } = this.state;

        const title = this.titleRef.current.value;
        if (!title) {
            const {
                include_contacts,
                include_non_contacts,
                include_bots,
                include_groups,
                include_channels,
                included_chat_ids
            } = editFilter;

            const {
                exclude_muted,
                exclude_read,
                exclude_archived,
                excluded_chat_ids
            } = editFilter;

            if (!included_chat_ids.length) {
                if (include_contacts && !include_non_contacts && !include_bots && !include_groups && !include_channels) {
                    this.setState({
                        title: t('FilterContacts')
                    });
                } else if (!include_contacts && include_non_contacts && !include_bots && !include_groups && !include_channels) {
                    this.setState({
                        title: t('FilterNonContacts')
                    });
                } else if (include_contacts && include_non_contacts && !include_bots && !include_groups && !include_channels) {
                    this.setState({
                        title: t('ChatHints')
                    });
                } else if (!include_contacts && !include_non_contacts && include_bots && !include_groups && !include_channels) {
                    this.setState({
                        title: t('FilterBots')
                    });
                } else if (!include_contacts && !include_non_contacts && !include_bots && include_groups && !include_channels) {
                    this.setState({
                        title: t('FilterGroups')
                    });
                } else if (!include_contacts && !include_non_contacts && !include_bots && !include_groups && include_channels) {
                    this.setState({
                        title: t('FilterChannels')
                    });
                }
            }
        }
    }

    handleCloseFilterChats = () => {

        this.setDefaultFilterTitle();

        this.setState({
            openFilterChats: false,
            mode: null
        })
    };

    handleChange = (type, value) => {
        const { editFilter } = this.state;
        if (!editFilter) return;

        let newEditFilter = null;
        switch (type) {
            case 'include_contacts': {
                newEditFilter = { ...editFilter, include_contacts: !editFilter.include_contacts };
                break;
            }
            case 'include_non_contacts': {
                newEditFilter = { ...editFilter, include_non_contacts: !editFilter.include_non_contacts };
                break;
            }
            case 'include_bots': {
                newEditFilter = { ...editFilter, include_bots: !editFilter.include_bots };
                break;
            }
            case 'include_groups': {
                newEditFilter = { ...editFilter, include_groups: !editFilter.include_groups };
                break;
            }
            case 'include_channels': {
                newEditFilter = { ...editFilter, include_channels: !editFilter.include_channels };
                break;
            }
            case 'included_chat_ids': {
                let included, excluded;
                if (editFilter.included_chat_ids.includes(value)) {
                    included = editFilter.included_chat_ids.filter(x => x !== value);
                    excluded = editFilter.excluded_chat_ids;
                } else {
                    included = [ ...editFilter.included_chat_ids, value ];
                    excluded = editFilter.excluded_chat_ids.filter(x => x !== value);
                }

                newEditFilter = {
                    ...editFilter,
                    included_chat_ids: included,
                    excluded_chat_ids: excluded
                };
                break;
            }
            case 'exclude_muted': {
                newEditFilter = { ...editFilter, exclude_muted: !editFilter.exclude_muted };
                break;
            }
            case 'exclude_read': {
                newEditFilter = { ...editFilter, exclude_read: !editFilter.exclude_read };
                break;
            }
            case 'exclude_archived': {
                newEditFilter = { ...editFilter, exclude_archived: !editFilter.exclude_archived };
                break;
            }
            case 'excluded_chat_ids': {
                let included, excluded;
                if (editFilter.excluded_chat_ids.includes(value)) {
                    excluded = editFilter.excluded_chat_ids.filter(x => x !== value);
                    included = editFilter.included_chat_ids;
                } else {
                    excluded = [ ...editFilter.excluded_chat_ids, value ];
                    included = editFilter.included_chat_ids.filter(x => x !== value);
                }

                newEditFilter = {
                    ...editFilter,
                    included_chat_ids: included,
                    excluded_chat_ids: excluded
                };

                break;
            }
        }

        // console.log('[f] onChange', type, value, newEditFilter);
        if (!newEditFilter) return;

        this.setState({
            editFilter: newEditFilter
        })
    };

    handleTitleChange = () => {
        const title = this.titleRef.current.value.substr(0, FILTER_TITLE_MAX_LENGTH);

        this.setState({
            title
        });
    }

    handleScroll = event => {
        const scroll = event.target;
        if (scroll.scrollTop + scroll.offsetHeight >= scroll.scrollHeight) {
            this.setState({
                limit: this.state.limit + CHAT_SLICE_LIMIT
            })
        }
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
        const { t, filter, id, onClose } = this.props;
        if (!filter) return null;

        const { editFilter, data, openFilterChats, mode, chats, limit, title, error, shook } = this.state;

        const {
            include_contacts,
            include_non_contacts,
            include_bots,
            include_groups,
            include_channels,
            included_chat_ids
        } = editFilter;

        const {
            exclude_muted,
            exclude_read,
            exclude_archived,
            excluded_chat_ids
        } = editFilter;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{id >= 0 ? t('FilterEdit') : t('CreateNewFilter')}</span>
                    </div>
                    <IconButton className='header-right-button' color='primary' onClick={this.handleDone}>
                        <DoneIcon />
                    </IconButton>
                </div>
                <div className='sidebar-page-content'>
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
                                        fileId: 'createFilter',
                                        stringData: data
                                    }}
                                    onClick={this.handleAnimationClick}
                                />
                            </React.Suspense>
                        )}
                    </div>


                    <div className='create-filter-title'>
                        <TextField
                            inputRef={this.titleRef}
                            className='edit-profile-input'
                            variant='outlined'
                            fullWidth
                            label={t('FilterNameHint')}
                            value={title}
                            error={error}
                            onChange={this.handleTitleChange}
                        />
                    </div>
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('FilterInclude')}</SectionHeader>
                        <FilterText className='create-filter-add-chats' icon={<AddIcon/>} text={t('FilterAddChats')} onClick={() => this.handleOpenFilterChats('include')}/>
                        {include_contacts && <FilterText onDelete={this.handleDeleteIncludeContacts} icon={<ContactsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterContacts')} />}
                        {include_non_contacts && <FilterText onDelete={this.handleDeleteIncludeNonContacts} icon={<NonContactsIcon className='filter-text-subtle-icon'/>} text={t('FilterNonContacts')} />}
                        {include_groups && <FilterText onDelete={this.handleDeleteIncludeGroups} icon={<GroupsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterGroups')} />}
                        {include_channels && <FilterText onDelete={this.handleDeleteIncludeChannels} icon={<ChannelsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterChannels')} />}
                        {include_bots && <FilterText onDelete={this.handleDeleteIncludeBots} icon={<BotsIcon className='filter-text-subtle-icon'/>} text={t('FilterBots')} />}
                        { included_chat_ids.map(x => (
                            <FilterChat key={x} chatId={x} onDelete={this.handleDeleteIncludedChat}/>
                        ))}
                    </div>
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('FilterExclude')}</SectionHeader>
                        <FilterText className='create-filter-remove-chats' icon={<RemoveIcon/>} text={t('FilterRemoveChats')} onClick={() => this.handleOpenFilterChats('exclude')}/>
                        {exclude_muted && <FilterText onDelete={this.handleDeleteExcludeMuted} icon={<MutedIcon className='filter-text-subtle-icon'/>} text={t('FilterMuted')} />}
                        {exclude_read && <FilterText onDelete={this.handleDeleteExcludeRead} icon={<ReadIcon className='filter-text-subtle-icon'/>} text={t('FilterRead')} />}
                        {exclude_archived && <FilterText onDelete={this.handleDeleteExcludeArchived} icon={<ArchivedIcon className='filter-text-subtle-icon'/>} text={t('FilterArchived')} />}
                        { excluded_chat_ids.map(x => (
                            <FilterChat key={x} chatId={x} onDelete={this.handleDeleteExcludedChat}/>
                        ))}
                    </div>
                </div>
                <SidebarPage open={openFilterChats} onClose={this.handleCloseFilterChats}>
                    <EditFilterChats filter={editFilter} mode={mode} chats={chats} limit={limit} onChange={this.handleChange} onScroll={this.handleScroll}/>
                </SidebarPage>
            </>
        );
    }

}

CreateFilter.propTypes = {
    filter: PropTypes.object,
    id: PropTypes.number,
    onDone: PropTypes.func,
    onClose: PropTypes.func
};

const enhance = compose(
    withTranslation(),
    withSnackbar,
);

export default enhance(CreateFilter);