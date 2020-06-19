/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import DoneIcon from '../../../Assets/Icons/Done';
import SectionHeader from '../SectionHeader';
import './CreateFilter.css';

class CreateFilter extends React.Component {

    constructor(props) {
        super(props);

        this.titleRef = React.createRef();

        this.state = {
            prevFilterId: -1
        }
    }

    static getDerivedStateFromProps(props, state) {
        const { filter, filterId } = props;
        const { prevFilterId } = state;

        if (filter && prevFilterId !== filterId){
            return {
                prevFilterId: filterId,
                editFilter: {...filter}
            }
        }

        return null;
    }

    handleDone = () => {
        const { onDone } = this.props;
        const { editFilter } = this.state;

        editFilter.title = this.titleRef.current.value;

        onDone && onDone(editFilter);
    };

    render() {
        const { t, filter, id, onClose } = this.props;
        if (!filter) return null;

        const { editFilter } = this.state;

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

        const defaultTitle = filter.title;

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
                    <TextField
                        inputRef={this.titleRef}
                        className='edit-profile-input'
                        variant='outlined'
                        fullWidth
                        label={t('FilterNameHint')}
                        defaultValue={defaultTitle}
                    />
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('FilterInclude')}</SectionHeader>
                    </div>
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('FilterExclude')}</SectionHeader>
                    </div>
                </div>
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

export default withTranslation()(CreateFilter);