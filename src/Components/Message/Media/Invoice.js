/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Photo from './Photo';
import './Invoice.css';

class Invoice extends React.Component {
    render() {
        const { chatId, messageId, invoice, openMedia, meta, t } = this.props;
        if (!invoice) return null;

        const { title, description, photo, is_test, total_amount, currency } = invoice;

        return (
            <div className='invoice'>
                { title && <div className='web-page-site-name'>{title}</div> }
                { description && <div className='invoice-description'>{description}{!Boolean(photo) && meta}</div> }
                { photo &&  (
                    <div className='invoice-photo'>
                        <Photo chatId={chatId} messageId={messageId} photo={photo} openMedia={openMedia} meta={meta}/>
                        <div className='media-top-meta'>{is_test ? t('PaymentTestInvoice') : t('PaymentInvoice')}</div>
                    </div>
                )}
            </div>
        );
    }
}

Invoice.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,

    invoice: PropTypes.object,
    openMedia: PropTypes.func
};

export default withTranslation()(Invoice);