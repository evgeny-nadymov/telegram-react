import React, {Component} from 'react';
import './Header.css';
import TdLibController from "../Controllers/TdLibController";
import packageJson from '../../package.json';

class Header extends Component{

    constructor(props){
        super(props);

        this.state = {
            authState: TdLibController.getState(),
            connectionState : ''
        };
        this.onStatusUpdated = this.onStatusUpdated.bind(this);
        this.onConnectionStateUpdated = this.onConnectionStateUpdated.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState !== this.state){
            return true;
        }

        return false;
    }

    componentDidMount(){
        TdLibController.on("tdlib_status", this.onStatusUpdated);
        TdLibController.on("tdlib_connection_state", this.onConnectionStateUpdated);
    }

    onConnectionStateUpdated(payload) {
        this.setState({ connectionState: payload});
    }

    onStatusUpdated(payload) {
        this.setState({ authState: payload});
    }

    componentWillUnmount(){
        TdLibController.removeListener("tdlib_connection_state", this.onConnectionStateUpdated);
        TdLibController.removeListener("tdlib_status", this.onStatusUpdated);
    }

    handleSubmit(args){
        args.preventDefault();
        let text = null;
        if (this.refs.inputControl){
            text = this.refs.inputControl.value;
            this.refs.inputControl.value = null;
        }

        TdLibController.onInput(text);
    }

    handleClearCache(args){
        args.preventDefault();

        this.props.onClearCache();
    }

    render(){
        const status = this.state.authState.status;
        const connectionState = this.state.connectionState? this.state.connectionState['@type'] : '';

        switch (status){
            case 'waitPhoneNumber':
                return (
                    <div className='header-wrapper'>
                        <div className='header-status'>
                            <span className='header-version'>{packageJson.version}</span>
                            <span>{status}</span>
                        </div>
                        <div>
                            <form id='send-form' onSubmit={args => this.handleSubmit(args)}>
                                <input id='phone-number' type='text' ref='inputControl'/>
                                <input id='send-phone-number' type='submit' value='send phone'/>
                            </form>
                        </div>
                    </div>
                );
            case 'waitCode':
                return (
                    <div className='header-wrapper'>
                        <div className='header-status'>
                            <span className='header-version'>{packageJson.version}</span>
                            <span>{status}</span>
                        </div>
                        <div>
                            <form id='auth-form' onSubmit={args => this.handleSubmit(args)}>
                                <input id='phone-code' type='text' ref='inputControl'/>
                                <input id='send-phone-code' type='submit' value='send code'/>
                            </form>
                        </div>
                    </div>
                );
            case 'waitPassword':
                return (
                    <div className='header-wrapper'>
                        <div className='header-status'>
                            <span className='header-version'>{packageJson.version}</span>
                            <span>{status}</span>
                        </div>
                        <div>
                            <form id='auth-form' onSubmit={args => this.handleSubmit(args)}>
                                <input id='phone-code' type='text' ref='inputControl'/>
                                <input id='send-phone-code' type='submit' value='send password'/>
                            </form>
                        </div>
                    </div>
                );
            case 'ready':
                return (
                    <div className='header-wrapper'>
                        <div className='header-status'>
                            <span className='header-version'>{packageJson.version}</span>
                            <span>{status}</span>
                        </div>
                        <form id='auth-form' onSubmit={args => this.handleSubmit(args)}>
                            <input id='log-out' type='submit' value='log out'/>
                        </form>
                        <form id='clear-form' onSubmit={args => this.handleClearCache(args)}>
                            <input id='clear' type='submit' value='clear cache'/>
                        </form>
                        <div className='header-status'>
                            <span>{connectionState}</span>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className='header-wrapper'>
                        <div className='header-status'>
                            <span className='header-version'>{packageJson.version}</span>
                            <span>{status}</span>
                        </div>
                    </div>
                );
        }
    }
}

export default Header;