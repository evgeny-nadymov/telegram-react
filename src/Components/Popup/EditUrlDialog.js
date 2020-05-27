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
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { validateUrl } from '../../Utils/Url';
import { modalManager } from '../../Utils/Modal';
import './EditUrlDialog.css';

class EditUrlDialog extends React.Component {
    constructor(props) {
        super(props);

        this.textRef = React.createRef();
        this.textInputRef = React.createRef();
        this.urlRef = React.createRef();
        this.urlInputRef = React.createRef();

        this.state = {};
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { defaultText, defaultUrl, open } = this.props;

        if (open && prevProps.open !== open) {
            setTimeout(() => {
                const text = this.textInputRef.current;
                const url = this.urlInputRef.current;

                if (!text) return;
                if (!url) return;

                if (!defaultText) {
                    text.focus();
                } else if (!defaultUrl) {
                    url.focus();
                } else {
                    text.focus();
                    text.select();
                }
            }, 0);
        }
    }

    componentDidMount() {
        // const { defaultText, defaultUrl } = this.props;
        //
        // const text = this.textInputRef.current;
        // const url = this.urlInputRef.current;
        //
        // if (!text) return;
        // if (!url) return;
        //
        // setTimeout(() => {
        //     if (!defaultText) {
        //         text.focus();
        //     } else if (!defaultUrl) {
        //         url.focus();
        //     } else {
        //         text.focus();
        //         // text.select();
        //     }
        // }, 0);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { defaultText, defaultUrl, onDone, onCancel, open } = this.props;
        const { textError, urlError } = this.state;

        if (nextProps.defaultText !== defaultText) {
            return true;
        }

        if (nextProps.defaultUrl !== defaultUrl) {
            return true;
        }

        if (nextState.textError !== textError) {
            return true;
        }

        if (nextState.urlError !== urlError) {
            return true;
        }

        if (nextProps.onDone !== onDone) {
            return true;
        }

        if (nextProps.onCancel !== onCancel) {
            return true;
        }

        if (nextProps.open !== open) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(props, state) {
        if (state.prevOpen !== props.open) {
            return {
                prevOpen: true,
                textError: false,
                urlError: false,
                text: null,
                url: null
            };
        }

        return null;
    }

    handleTextKeyDown = event => {
        if (event.key === 'Enter') {
            this.urlInputRef.current.focus();
            event.preventDefault();
            event.stopPropagation();
        }
    };

    handleUrlKeyDown = event => {
        if (event.key === 'Enter') {
            this.handleDone();
            event.preventDefault();
            event.stopPropagation();
        }
    };

    handleTextChange = event => {
        this.setState({
            text: event.target.value
        });
    };

    handleUrlChange = event => {
        this.setState({
            url: event.target.value
        });
    };

    handleDone = () => {
        const { defaultText, defaultUrl } = this.props;
        let { text, url } = this.state;

        text = text !== null ? text : defaultText;
        url = url !== null ? url : defaultUrl;

        if (!text && !url) {
            this.textInputRef.current.focus();
            return;
        }

        if (!text) {
            this.setState({ textError: true });
            this.textInputRef.current.focus();
            return;
        }

        url = validateUrl(url);
        if (!url) {
            this.setState({ urlError: true });
            this.urlInputRef.current.focus();
            return;
        }

        const { onDone } = this.props;

        onDone(text, url);
    };

    handleCancel = () => {
        const { onCancel } = this.props;

        onCancel();
    };

    render() {
        const { open, defaultUrl, defaultText, t } = this.props;
        const { textError, urlError } = this.state;
        if (!open) return null;

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClose={this.handleCancel}
                aria-labelledby='edit-url-dialog-title'>
                <DialogTitle id='edit-url-dialog-title'>{t('CreateLink')}</DialogTitle>
                <DialogContent>
                    <div style={{ display: 'flex', flexDirection: 'column', width: 260 }}>
                        <TextField
                            ref={this.textRef}
                            inputRef={this.textInputRef}
                            label={t('Text')}
                            margin='normal'
                            autoComplete='off'
                            defaultValue={defaultText}
                            error={textError}
                            onChange={this.handleTextChange}
                            onKeyDown={this.handleTextKeyDown}
                        />
                        <TextField
                            ref={this.urlRef}
                            inputRef={this.urlInputRef}
                            label={t('URL')}
                            margin='normal'
                            autoComplete='off'
                            defaultValue={defaultUrl}
                            error={urlError}
                            onChange={this.handleUrlChange}
                            onKeyDown={this.handleUrlKeyDown}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCancel} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={this.handleDone} color='primary'>
                        {t('Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

EditUrlDialog.propTypes = {
    open: PropTypes.bool,
    defaultText: PropTypes.string,
    defaultUrl: PropTypes.string,
    onDone: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default withTranslation()(EditUrlDialog);
