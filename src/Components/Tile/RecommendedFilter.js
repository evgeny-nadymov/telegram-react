/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TdLibController from '../../Controllers/TdLibController';
import './RecommendedFilter.css';

class RecommendedFilter extends React.Component {

    handleAdd = () => {
        const { filter: recommendedFilter } = this.props;
        if (!recommendedFilter) return;

        const { filter } = recommendedFilter;

        TdLibController.send({
            '@type': 'createChatFilter',
            filter
        });
    };

    render() {
        const { t, filter: recommendedFilter } = this.props;
        if (!recommendedFilter) return null;

        const { filter, description } = recommendedFilter;

        return (
            <ListItem
                className='settings-list-item2'
                role={undefined}
                button>
                <ListItemText
                    className='settings-list-item-text'
                    primary={filter.title}
                    secondary={description}
                />
                <Button className='recommended-filter-add' variant='contained' disableElevation color='primary' onClick={this.handleAdd}>
                    {t('Add')}
                </Button>
            </ListItem>
        );
    }

}

RecommendedFilter.propTypes = {
    filter: PropTypes.object.isRequired
};

export default withTranslation()(RecommendedFilter);