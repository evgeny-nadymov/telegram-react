import React, {Component} from 'react';
import './Header.css';
import TdLibController from "../Controllers/TdLibController";
import packageJson from '../../package.json';

class Header extends Component{

    constructor(props){
        super(props);

        this.state = TdLibController.getState();
        this.onStatusUpdated = this.onStatusUpdated.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState !== this.state){
            return true;
        }

        return false;
    }

    componentDidMount(){
        TdLibController.on("tdlib_status", this.onStatusUpdated)
    }

    onStatusUpdated(payload) {
        this.setState(payload);
    }

    componentWillUnmount(){
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

    render(){
        const status = this.state.status;

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
                        <div>
                            <form id='auth-form' onSubmit={args => this.handleSubmit(args)}>
                                <input id='log-out' type='submit' value='log out'/>
                            </form>
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