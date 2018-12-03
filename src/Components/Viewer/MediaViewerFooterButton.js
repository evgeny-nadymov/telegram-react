import React from 'react';
import PropTypes from 'prop-types';
import './MediaViewerFooterButton.css';

class MediaViewerFooterButton extends React.Component {
  handleClick = event => {
    event.stopPropagation();

    const { onClick, disabled } = this.props;

    if (disabled) return;

    onClick(event);
  };

  render() {
    const { title, disabled, children } = this.props;

    return (
      <div
        className={
          disabled
            ? 'media-viewer-footer-button-disabled'
            : 'media-viewer-footer-button'
        }
        title={title}
        onClick={this.handleClick}
      >
        {children}
      </div>
    );
  }
}

MediaViewerFooterButton.propTypes = {
  title: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default MediaViewerFooterButton;
