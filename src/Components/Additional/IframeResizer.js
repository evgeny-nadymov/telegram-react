/**
 *
 * inject script to facilitate iframe resizing
 * https://github.com/davidjbradshaw/iframe-resizer
 *
 */
import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { iframeResizer as iframeResizerLib } from 'iframe-resizer';

class IframeResizer extends React.Component {
    constructor(props) {
        super(props);

        this.frameRef = React.createRef();
    }

    componentDidMount() {
        // can't update until we have a mounted iframe
        this.updateIframe(this.props);
        this.resizeIframe(this.props);
    }

    componentWillUnmount() {
        // React will remove the iframe, however we need to manually
        // call iframe-resizer to stop its listeners
        const frame = this.frameRef.current;
        if (!frame) return;

        const { iframeResizer } = frame;
        if (!iframeResizer) return;

        iframeResizer.removeListeners();
    }

    componentWillReceiveProps(nextProps) {
        // can replace content if we got new props
        this.updateIframe(nextProps);
        this.resizeIframe(nextProps);
    }

    updateIframe = props => {
        // has src - no injected content
        if (props.src) return;
        // do we have content to inject (content or children)
        const content = props.content || props.children;
        if (!content) return;
        // get frame to inject into
        const frame = this.frameRef.current;
        if (!frame) return;
        // verify frame document access
        // Due to browser security, this will fail with the following error
        //   Uncaught DOMException: Failed to read the 'contentDocument' property from 'HTMLIFrameElement':
        //   Blocked a frame with origin "http://<hostname>" from accessing a cross-origin frame.
        // resolve this by loading documents from the same domain name,
        // or injecting HTML `content` vs. loading via `src`
        const doc = frame.contentDocument;
        if (!doc) return;
        // replace iframe document content
        if (typeof content === 'string') {
            // assume this is a HTML block
            //   we could send this in via REACT dangerously set HTML
            //   but we are in an iframe anyway, already a red-headed step-child.
            doc.open();
            doc.write(content);
            doc.close();
        } else {
            // assume this is a REACT component
            doc.open();
            doc.write('<div id="iframe-root"></div>');
            doc.close();
            ReactDOM.render(content, doc.getElementById('iframe-root'));
        }
    };

    // inject the iframe resizer "content window" script
    injectIframeResizerUrl = () => {
        if (!this.props.iframeResizerUrl) return;
        const frame = this.frameRef.current;
        if (!frame) return;
        // verify frame document access
        // Due to browser security, this will fail with the following error
        //   Uncaught DOMException: Failed to read the 'contentDocument' property from 'HTMLIFrameElement':
        //   Blocked a frame with origin "http://<hostname>" from accessing a cross-origin frame.
        // resolve this by loading documents from the same domain name,
        // or injecting HTML `content` vs. loading via `src`
        const doc = frame.contentDocument;
        if (!doc) return;
        // where can we insert into? (fail into whatever we can find)
        let injectTarget = null;
        ['head', 'HEAD', 'body', 'BODY', 'div', 'DIV'].forEach(tagName => {
            if (injectTarget) return;
            const found = doc.getElementsByTagName(tagName);
            if (!(found && found.length)) return;
            injectTarget = found[0];
        });
        if (!injectTarget) {
            console.error('Unable to inject iframe resizer script');
            return;
        }
        const resizerScriptElement = document.createElement('script');
        resizerScriptElement.type = 'text/javascript';
        resizerScriptElement.src = this.props.iframeResizerUrl;
        injectTarget.appendChild(resizerScriptElement);
    };

    onLoad = () => {
        this.injectIframeResizerUrl();
        // DISABLED because it's causing a loading loop :(
        // if (this.props.onIframeLoaded) this.props.onIframeLoaded();
    };

    resizeIframe = props => {
        const frame = this.frameRef.current;
        if (!frame) return;
        if (props.iframeResizerEnable) {
            iframeResizerLib(props.iframeResizerOptions, frame);
        }
    };

    render() {
        const { src, id, frameBorder, className, style } = this.props;
        return (
            <iframe
                ref={this.frameRef}
                src={src}
                id={id}
                frameBorder={frameBorder}
                className={className}
                style={style}
                onLoad={this.onLoad}
            />
        );
    }
}
IframeResizer.propTypes = {
    // iframe content/document
    // option 1. content of HTML to load in the iframe
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    // option 2. src to a URL to load in the iframe
    src: PropTypes.string,
    // iframe-resizer controls and helpers
    iframeResizerEnable: PropTypes.bool,
    iframeResizerOptions: PropTypes.object,
    iframeResizerUrl: PropTypes.oneOfType([
        PropTypes.string, // URL to inject
        PropTypes.bool // false = disable inject
    ]),
    // misc props to pass through to iframe
    id: PropTypes.string,
    frameBorder: PropTypes.number,
    className: PropTypes.string,
    style: PropTypes.object
    // optional extra callback when iframe is loaded
    // onIframeLoaded: PropTypes.func,
};
IframeResizer.defaultProps = {
    // resize iframe
    iframeResizerEnable: true,
    iframeResizerOptions: {
        // log: true,
        // autoResize: true,
        // checkOrigin: false,
        // resizeFrom: 'parent',
        // heightCalculationMethod: 'max',
        // initCallback: () => { console.log('ready!'); },
        // resizedCallback: () => { console.log('resized!'); },
    },
    iframeResizerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.5.8/iframeResizer.contentWindow.min.js',
    // misc props to pass through to iframe
    frameBorder: 0,
    style: {
        width: '100%',
        minHeight: 20
    }
};

export default IframeResizer;
