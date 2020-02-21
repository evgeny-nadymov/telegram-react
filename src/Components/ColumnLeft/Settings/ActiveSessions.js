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
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Session from '../../Tile/Session';
import TdLibController from '../../../Controllers/TdLibController';
import './ActiveSessions.css';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import StopIcon from '../../../Assets/Icons/Stop';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';

class ActiveSessions extends React.Component {
    state = {
        open: false,
        openAll: false,
        session: null
    };

    handleClose = () => {
        TdLibController.clientUpdate({ '@type': 'clientUpdateActiveSessionsPage', opened: false });
    };

    handleTerminate = session => {
        this.setState({
            open: true,
            session
        });
    };

    handleTerminateAllOther = () => {
        this.setState({
            openAll: true
        });
    };

    handleCloseConfirmation = () => {
        this.setState({
            open: false,
            session: null
        });
    };

    handleDoneConfirmation = async () => {
        const { sessions } = this.props;
        const { session } = this.state;
        if (!session) return;

        this.setState({
            open: false,
            session: null
        });

        await TdLibController.send({
            '@type': 'terminateSession',
            session_id: session.id
        });

        sessions.sessions = sessions.sessions.filter(x => x.id !== session.id);
        this.forceUpdate();
    };

    handleCloseAllConfirmation = () => {
        this.setState({
            openAll: false
        });
    };

    handleDoneAllConfirmation = async () => {
        const { sessions } = this.props;

        this.setState({
            openAll: false
        });

        await TdLibController.send({
            '@type': 'terminateAllOtherSessions'
        });

        sessions.sessions = sessions.sessions.filter(x => !x.is_current);
        this.forceUpdate();
    };

    render() {
        const { t, sessions } = this.props;
        const { open, openAll } = this.state;

        const current = sessions.sessions.find(x => x.is_current);
        const other = sessions.sessions.filter(x => !x.is_current);

        return (
            <>
                <div className='sidebar-page'>
                    <div className='header-master'>
                        <IconButton className='header-left-button' onClick={this.handleClose}>
                            <ArrowBackIcon />
                        </IconButton>
                        <div className='header-status grow cursor-pointer'>
                            <span className='header-status-content'>{t('SessionsTitle')}</span>
                        </div>
                    </div>
                    <div className='sidebar-page-content'>
                        {Boolean(current) && (
                            <div className='settings-section'>
                                <div className='settings-section-header'>{t('CurrentSession')}</div>
                                <Session session={current} onTerminate={this.handleTerminate} />
                                {other.length > 0 && (
                                    <ListItem
                                        className='settings-list-item'
                                        button
                                        disableRipple
                                        onClick={this.handleTerminateAllOther}>
                                        <ListItemIcon>
                                            <StopIcon color='secondary' />
                                        </ListItemIcon>
                                        <ListItemText
                                            primaryTypographyProps={{ color: 'secondary' }}
                                            primary={t('TerminateAllSessions')}
                                        />
                                    </ListItem>
                                )}
                            </div>
                        )}
                        {other.length > 0 && (
                            <>
                                <div className='settings-border' />
                                <div className='settings-section'>
                                    <div className='settings-section-header'>{t('OtherSessions')}</div>
                                    {other.map(x => (
                                        <Session key={x.id} session={x} onTerminate={this.handleTerminate} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <Dialog
                    transitionDuration={0}
                    open={open}
                    onClose={this.handleCloseConfirmation}
                    aria-labelledby='form-dialog-title'>
                    <DialogTitle id='form-dialog-title'>{t('Confirm')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>
                            {t('TerminateSessionText')}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseConfirmation} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleDoneConfirmation} color='primary'>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    transitionDuration={0}
                    open={openAll}
                    onClose={this.handleCloseAllConfirmation}
                    aria-labelledby='form-dialog-title'>
                    <DialogTitle id='form-dialog-title'>{t('Confirm')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>
                            {t('AreYouSureSessions')}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseAllConfirmation} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleDoneAllConfirmation} color='primary'>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

ActiveSessions.propTypes = {
    sessions: PropTypes.object.isRequired
};

export default withTranslation()(ActiveSessions);
