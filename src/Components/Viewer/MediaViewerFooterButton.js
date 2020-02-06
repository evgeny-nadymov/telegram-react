import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './MediaViewerFooterButton.css';

class MediaViewerFooterButton extends React.Component {
    handleClick = event => {
        event.stopPropagation();

        const { onClick, disabled } = this.props;

        if (disabled) return;

        onClick(event);
    };

    render() {
        const { checked, children, disabled, title } = this.props;

        return (
            <div
                className={classNames('media-viewer-footer-button', {
                    'media-viewer-footer-button-checked': checked,
                    'media-viewer-footer-button-disabled': disabled
                })}
                title={title}
                onClick={this.handleClick}>
                {children}
            </div>
        );
    }
}

MediaViewerFooterButton.propTypes = {
    title: PropTypes.string,
    disabled: PropTypes.bool,
    checked: PropTypes.bool,
    onClick: PropTypes.func
};

export default MediaViewerFooterButton;
