/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ReactIframeResizer from '../../Additional/IframeResizer';
import Caption from './Caption';

class Embedded extends React.Component {
    state = {};

    static getDerivedStateFromProps(props, state) {
        if (props.url !== state.prevUrl || props.html !== state.prevHtml) {
            return {
                url: null,
                html: null,
                prevUrl: props.url,
                prevHtml: props.html
            };
        }

        return null;
    }

    componentDidMount() {
        this.setIframeSource();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { url, html } = this.props;

        if (url !== prevProps.url || html !== prevProps.html) {
            this.setIframeSource();
        }
    }

    setIframeSource() {
        const { url, html } = this.props;

        this.setState({
            url,
            html
        });
    }

    render() {
        const { url, html } = this.state;
        const { width, height, caption, isFullWidth, allowScrolling } = this.props;

        const options = {
            scrolling: allowScrolling
        };

        const hasWidthHeight = width > 0 && height > 0;
        const hasSource = Boolean(url) || Boolean(html);

        return (
            <figure>
                {hasSource && (
                    <>
                        {hasWidthHeight ? (
                            <iframe
                                src={url ? url : null}
                                srcDoc={url ? null : html}
                                width={width > 0 ? width : null}
                                height={height > 0 ? height : null}
                                allowFullScreen={isFullWidth}
                                scrolling={allowScrolling ? 'auto' : 'no'}
                                frameBorder={0}
                            />
                        ) : (
                            <ReactIframeResizer
                                content={html}
                                src={url}
                                iframeResizerOptions={options}
                                style={{ width: '100%' }}
                            />
                        )}
                    </>
                )}
                <Caption text={caption.text} credit={caption.credit} />
            </figure>
        );
    }
}

Embedded.propTypes = {
    url: PropTypes.string.isRequired,
    html: PropTypes.string.isRequired,
    posterPhoto: PropTypes.object,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    caption: PropTypes.object.isRequired,
    isFullWidth: PropTypes.bool.isRequired,
    allowScrolling: PropTypes.bool.isRequired
};

export default Embedded;
