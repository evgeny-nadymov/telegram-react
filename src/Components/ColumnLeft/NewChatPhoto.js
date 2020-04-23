/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Cropper from 'react-cropper';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import AddImageIcon from '../../Assets/Icons/AddImage';
import CloseIcon from '../../Assets/Icons/Close';
import CheckIcon from '../../Assets/Icons/Check';
import { getFitSize, readImageSize } from '../../Utils/Common';
import 'cropperjs/dist/cropper.css';
import './NewChatPhoto.css';

class NewChatPhoto extends React.Component {
    constructor(props) {
        super(props);

        this.attachPhotoRef = React.createRef();
        this.cropperRef = React.createRef();

        const { defaultURL } = this.props;

        this.state = {
            blobURL: defaultURL,
            open: false
        }
    }

    handleCancel = () => {
        this.setState({
            open: false
        });
    }

    handleDone = () => {
        const cropper = this.cropperRef.current;
        if (!cropper) return;

        cropper.getCroppedCanvas().toBlob(blob => {
            const blobURL = URL.createObjectURL(blob);

            this.setState({
                blob,
                blobURL
            });

            const { onChoose } = this.props;
            if (!onChoose) return;

            onChoose(blob, blobURL);
        }, 'image/jpeg');

        this.handleCancel();
    };

    handleAttach = () => {
        this.attachPhotoRef.current.click();
    };

    handleAttachComplete = async () => {
        const { files } = this.attachPhotoRef.current;
        if (files.length === 0) return;

        if (files.length === 1) {
            const [ file, ...rest ] = Array.from(files);
            if (!file) return;

            const [width, height] = await readImageSize(file);

            this.setState({
                open: true,
                file,
                fileURL: URL.createObjectURL(file),
                width,
                height
            });
        }

        this.attachPhotoRef.current.value = '';
    };

    render() {
        const { t } = this.props;
        const { open, width, height, fileURL, blobURL } = this.state;

        const { width: fitWidth, height: fitHeight } = getFitSize({ width, height }, 400, true);

        return (
            <>
                <div className='new-chat-photo'>
                    { blobURL ? (
                        <img className='new-chat-photo-image-button' alt='' src={blobURL} onClick={this.handleAttach}/>
                        ) : (
                        <div className='new-chat-photo-image-button new-chat-photo-button' onClick={this.handleAttach}>
                            <AddImageIcon className='new-chat-photo-icon'/>
                        </div>
                    )}
                </div>
                <input
                    ref={this.attachPhotoRef}
                    className='inputbox-attach-button'
                    type='file'
                    multiple={false}
                    accept='image/*'
                    onChange={this.handleAttachComplete}
                />
                { open && (
                    <Dialog
                        transitionDuration={0}
                        open={true}
                        onClose={this.handleCancel}
                        aria-labelledby='dialog-title'>
                        <div className='header-master'>
                            <IconButton className='header-left-button' onClick={this.handleCancel}>
                                <CloseIcon/>
                            </IconButton>
                            <div className='header-status grow cursor-pointer'>
                                <span className='header-status-content'>{t('DragToReposition')}</span>
                            </div>
                        </div>
                        <DialogContent>
                            <Cropper
                                ref={this.cropperRef}
                                src={fileURL}
                                style={{ height: fitHeight, width: fitWidth, margin: '0 46px 62px' }}
                                // Cropper.js options
                                aspectRatio={1}
                                viewMode={3}
                                guides={false} />
                        </DialogContent>
                        <div className='new-chat-photo-done-button ' onClick={this.handleDone}>
                            <CheckIcon/>
                        </div>
                    </Dialog>
                )}
            </>
        );
    }

}

NewChatPhoto.propTypes = {
    defaultURL: PropTypes.string,
    onChoose: PropTypes.func
};

export default withTranslation()(NewChatPhoto);