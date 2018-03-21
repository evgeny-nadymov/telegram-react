import React from 'react';
import packageJson from '../../package.json';
import TdLibController from "../Controllers/TdLibController";
import './Footer.css'

class Footer extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            authState: TdLibController.getState()
        };
        this.onStatusUpdated = this.onStatusUpdated.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState !== this.state){
            return true;
        }

        return false;
    }

    componentDidMount(){
        TdLibController.on("tdlib_status", this.onStatusUpdated);
    }

    onStatusUpdated(payload) {
        this.setState({ authState: payload});
    }

    componentWillUnmount(){
        TdLibController.removeListener("tdlib_status", this.onStatusUpdated);
    }

    render() {
        const status = this.state.authState.status;

        return (
            <div className='footer-wrapper'>
                <span>
                    Telegram v{packageJson.version} - {status}
                </span>
            </div>
        );
    }
}

export default Footer;