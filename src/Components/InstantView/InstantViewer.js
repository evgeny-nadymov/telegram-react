/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import CloseIcon from '@material-ui/icons/Close';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import Article from './Article';
import MediaViewerButton from '../Viewer/MediaViewerButton';
import { setInstantViewContent } from '../../Actions/Client';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './InstantViewer.css';
import { loadInstantViewContent } from '../../Utils/File';
import IVContext from './IVContext';

const styles = theme => ({
    instantViewer: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    },
    backButton: {
        color: theme.palette.text.secondary,
        position: 'fixed',
        top: 0,
        left: 0
    },
    closeButton: {
        color: theme.palette.text.secondary,
        position: 'fixed',
        top: 0,
        right: 0
    }
});

class InstantViewer extends React.Component {
    constructor(props) {
        super(props);

        this.articleRef = React.createRef();
        this.instantViewerRef = React.createRef();
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown, false);
        ApplicationStore.on('clientUpdateInstantViewUrl', this.onClientUpdateInstantViewUrl);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown, false);
        ApplicationStore.removeListener('clientUpdateInstantViewUrl', this.onClientUpdateInstantViewUrl);
    }

    onClientUpdateInstantViewUrl = async update => {
        console.log('[IV] clientUpdateInstantViewUrl', update);
        const { url } = update;
        const { instantViewerContent } = ApplicationStore;
        const activeInstantView = instantViewerContent !== null ? instantViewerContent.instantView : null;
        const { instantView } = this.props;

        if (activeInstantView !== instantView) return;

        if (instantView && url.startsWith(instantView.url)) {
            const hash = new URL(url).hash;
            if (url.indexOf('#') === url.length - 1) {
                this.scrollTop('smooth');

                return;
            } else if (hash && this.scrollToHash(hash, 'smooth')) {
                return;
            }
        }

        try {
            const result = await TdLibController.send({
                '@type': 'getWebPageInstantView',
                url,
                force_full: true
            });

            console.log('[IV] open', result);
            loadInstantViewContent(result);
            setInstantViewContent({ instantView: result });
        } catch {
            const newWindow = window.open();
            newWindow.opener = null;
            newWindow.location = url;
        }
    };

    scrollToHash(hash, behavior) {
        if (!hash) return false;

        const hiddenElement = document.getElementById(hash.substr(1));
        if (hiddenElement) {
            const details = [];
            let finished = false;
            let currentElement = hiddenElement;
            do {
                currentElement = currentElement.parentNode;
                if (currentElement) {
                    if (currentElement.nodeName === 'DETAILS') {
                        details.push(currentElement);
                    } else if (currentElement.nodeName === 'ARTICLE') {
                        finished = true;
                    }
                } else {
                    finished = true;
                }
            } while (!finished);

            details.forEach(x => (x.open = true));

            hiddenElement.scrollIntoView({
                block: 'center',
                behavior
            });

            return true;
        }

        return false;
    }

    scrollTop(behavior) {
        this.instantViewerRef.current.scrollTo({
            top: 0,
            behavior
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { instantView, url } = this.props;
        console.log('[IV] componentDidUpdate', instantView.url, instantView.url === prevProps.instantView.url);

        if (prevProps.instantView.url !== instantView.url) {
            const hash = new URL(instantView.url).hash;
            if (instantView.url.indexOf('#') === instantView.url.length - 1) {
                console.log('[IV] componentDidUpdate scrollTop 1');
                this.scrollTop('auto');
            } else if (hash) {
                console.log('[IV] componentDidUpdate scrollToHash', hash);
                this.scrollToHash(hash, 'auto');
            } else {
                console.log('[IV] componentDidUpdate scrollTop 2');
                this.scrollTop('auto');
            }
        }
    }

    onKeyDown = event => {
        if (event.keyCode === 27) {
            this.handleClose();
        }
    };

    handleClose() {
        setInstantViewContent(null);
    }

    handleBack() {}

    render() {
        const { classes, instantView } = this.props;
        if (!instantView) return null;

        return (
            <div ref={this.instantViewerRef} className={classNames('instant-viewer', classes.instantViewer)}>
                <div className='instant-viewer-left-column'>
                    <MediaViewerButton className={classes.backButton} onClick={this.handleBack}>
                        <ChevronLeftIcon className='media-viewer-button-icon' fontSize='large' />
                    </MediaViewerButton>
                </div>
                <div className='instant-viewer-content-column'>
                    <IVContext.Provider value={instantView}>
                        <Article ref={this.articleRef} />
                    </IVContext.Provider>
                </div>
                <div className='instant-viewer-right-column'>
                    <MediaViewerButton className={classes.closeButton} onClick={this.handleClose}>
                        <CloseIcon className='media-viewer-button-icon' fontSize='large' />
                    </MediaViewerButton>
                </div>
            </div>
        );
    }
}

InstantViewer.propTypes = {
    instantView: PropTypes.object.isRequired
};

const enhance = compose(
    withStyles(styles),
    withTranslation()
);

export default enhance(InstantViewer);
