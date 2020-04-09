/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import DownloadIcon from '../../Assets/Icons/Download';
import AppStore from '../../Stores/ApplicationStore';
import './UpdatePanel.css';

class UpdatePanel extends React.Component {
    constructor(props) {
        super(props);

        const { isSmallWidth } = AppStore;

        this.state = {
            newContentAvailable: false,
            isSmallWidth
        };
    }

    componentDidMount() {
        AppStore.on('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
    }

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = update;

        this.setState({ isSmallWidth });
    };

    onClientUpdateNewContentAvailable = () => {
        this.setState({ newContentAvailable: true });
    };

    handleUpdate = () => {
        if (this.handled) return;

        this.handled = true;
        setTimeout(() => {
            window.location.reload();
        }, 250);
    };

    render() {
        const { newContentAvailable, isSmallWidth } = this.state;
        const { t } = this.props;

        if (!newContentAvailable) {
            return null;
        }

        return (
            <Button className='update-button' variant='contained' color='primary' onClick={this.handleUpdate}>
                {isSmallWidth ? <DownloadIcon/> : t('Update')}
            </Button>
        );
    }
}

export default withTranslation()(UpdatePanel);
