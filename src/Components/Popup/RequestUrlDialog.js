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
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { modalManager } from '../../Utils/Modal';
import { getUserFullName, getUserShortName } from '../../Utils/User';
import { getFormattedText, getSimpleMarkupEntities } from '../../Utils/Message';
import LStore from '../../Stores/LocalizationStore';
import UserStore from '../../Stores/UserStore';
import './RequestUrlDialog.css';

class RequestUrlDialog extends React.Component {
    state = {
        value1: true,
        value2: true
    };

    handleValue1Change = () => {
        const { value1 } = this.state;

        this.setState({ value1: !value1 });
    };

    handleValue2Change = () => {
        const { value2 } = this.state;

        this.setState({ value2: !value2 });
    };

    render() {
        const { url, params, onClose, t } = this.props;
        if (!url) return null;

        const { value1, value2 } = this.state;

        const { result } = params;
        if (!result) return null;

        const { domain, bot_user_id, request_write_access } = result;

        let text1 = LStore.formatString('OpenUrlOption1', domain, getUserFullName(UserStore.getMyId()));
        const entities1 = [];
        text1 = getSimpleMarkupEntities(text1, entities1);
        const option1 = (
            <FormControlLabel
                control={<Checkbox color='primary' checked={value1} onChange={this.handleValue1Change}/>}
                label={getFormattedText({ '@type': 'formattedText', text: text1, entities: entities1 }, t)}
            />
        );

        let option2 = null;
        if (request_write_access) {
            let text2 = LStore.formatString('OpenUrlOption2', getUserShortName(bot_user_id, t));
            const entities2 = [];
            text2 = getSimpleMarkupEntities(text2, entities2);
            option2 = (
                <FormControlLabel
                    control={<Checkbox color='primary' checked={value2} onChange={this.handleValue2Change}/>}
                    label={getFormattedText({ '@type': 'formattedText', text: text2, entities: entities2 }, t)}
                />
            );
        }

        return (
            <Dialog
                open={true}
                manager={modalManager}
                transitionDuration={0}
                onClose={e => onClose(e, false)}
                classes={{ paper: 'alert-dialog' }}>
                <DialogTitle>{t('OpenUrlTitle')}</DialogTitle>
                <DialogContent style={{ display: 'flex', flexDirection: 'column', overflowWrap: 'break-word' }}>
                    <DialogContentText>
                        {LStore.formatString('OpenUrlAlert2', url)}
                    </DialogContentText>
                    {option1}
                    {option2}
                </DialogContent>
                <DialogActions>
                    <Button onClick={e => onClose(e, false)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={e => onClose(e, true, { value1, value2 })} color='primary'>
                        {t('Open')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

RequestUrlDialog.propTypes = {
    url: PropTypes.string,
    params: PropTypes.object,
    onClose: PropTypes.func
};

export default withTranslation()(RequestUrlDialog);