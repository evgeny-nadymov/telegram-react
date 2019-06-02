import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import './MediaViewerFooterButton.css';

const styles = theme => ({
    checked: {
        color: theme.palette.primary.main
    }
});

class MediaViewerFooterButton extends React.Component {
    handleClick = event => {
        event.stopPropagation();

        const { onClick, disabled } = this.props;

        if (disabled) return;

        onClick(event);
    };

    render() {
        const { checked, children, classes, disabled, title } = this.props;

        return (
            <div
                className={classNames(disabled ? 'media-viewer-footer-button-disabled' : 'media-viewer-footer-button', {
                    [classes.checked]: checked
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

export default withStyles(styles)(MediaViewerFooterButton);
