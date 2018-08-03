import React, {PropTypes} from 'react';
import './ContactControl.css';
import UserTileControl from "../UserTileControl";
import UserStore from '../../Stores/UserStore'

class ContactControl extends React.Component {
    constructor(props){
        super(props);
    }


    render() {
        let message = this.props.message;
        if (!message) return null;
        if (!message.content) return null;

        let contact = message.content.contact;
        if (!contact) return null;

        let user = UserStore.get(contact.user_id);
        let fullName = `${contact.first_name} ${contact.last_name}`;
        let phoneNumber = `+${contact.phone_number}`;
        return (
            <div className='contact'>
                <UserTileControl user={user} className='contact-tile'/>
                <div className='contact-content'>
                    <div className='contact-name'><a onClick={this.props.openMedia}>{fullName}</a></div>
                    <div className='contact-phone'>{phoneNumber}</div>
                </div>
            </div>
        );
    }
}

export default ContactControl;