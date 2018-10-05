import React, {Component} from 'react';
import './Dialogs.css';
import DialogsHeader from './DialogsHeader';
import Header from './Header';
import DialogsList from './DialogsList';
import UpdatePanel from './UpdatePanel';
import TdLibController from '../Controllers/TdLibController';
import ApplicationStore from '../Stores/ApplicationStore';

class Dialogs extends Component{
    constructor(props){
        super(props);

        this.dialogsList = React.createRef();
        
        this.state = {
            newContentAvailable: false
        };

        this.handleHeaderClick = this.handleHeaderClick.bind(this);
        this.onClientUpdateNewContentAvailable = this.onClientUpdateNewContentAvailable.bind(this);
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
    }

    onClientUpdateNewContentAvailable(){
        this.setState({ newContentAvailable: true });
    }

    handleHeaderClick(){
        this.dialogsList.current.scrollToTop();
    }

    render(){
        const {newContentAvailable} = this.state;
        
        return (
            <div className='master'>
                <DialogsHeader onClearCache={this.props.onClearCache} onClick={this.handleHeaderClick}/>
                <DialogsList ref={this.dialogsList} authState={this.props.authState} onSelectChat={this.props.onSelectChat}/>
                {newContentAvailable && <UpdatePanel/>}
            </div>
        );
    }
}

export default Dialogs;