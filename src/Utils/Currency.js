
/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

class Currency{
    constructor(){
        this.list = new Map([
            ["AED", "د.إ"],
            ["AFN", "؋"],
            ["ARS", "$"],
            ["AUD", "$"],
            ["AZN", "₼"],
            ["BND", "B$"],
            ["BRL", "R$"],
            ["CAD", "$"],
            ["CHF", "Fr"],
            ["CLP", "$"],
            ["CNY", "¥"],
            ["COP", "$"],
            ["EGP", "E£"],
            ["EUR", "€"],
            ["GBP", "£"],
            ["HKD", "$"],
            ["IDR", "Rp"],
            ["ILS", "₪"],
            ["INR", "₹"],
            ["ISK", "kr"],
            ["JPY", "¥"],
            ["KRW", "₩"],
            ["KZT", "₸"],
            ["MXN", "$"],
            ["MYR", "RM"],
            ["NOK", "kr"],
            ["NZD", "$"],
            ["PHP", "₱"],
            ["RUB", "₽"],
            ["SAR", "SR"],
            ["SEK", "kr"],
            ["SGD", "$"],
            ["TRY", "₺"],
            ["TTD", "$"],
            ["TWD", "$"],
            ["TZS", "TSh"],
            ["UAH", "₴"],
            ["UGX", "USh"],
            ["USD", "$"],
            ["UYU", "$"],
            ["VND", "₫"],
            ["YER", "﷼"],
            ["ZAR", "R"],
            ["IRR", "﷼"],
            ["IQD", "ع.د"],
            ["VEF", "Bs.F."]
        ]);
    }

    get(currency){
        return this.list.get(currency);
    }

    set(currency, symbol){
        this.list.set(currency, symbol);
    }

    getPow(currency){
        if (currency === 'CLF'){
            return 4;
        }
        if (['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'].includes(currency)){
            return 3;
        }
        if (['BIF', 'BYR', 'CLP', 'CVE', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'].includes(currency)){
            return 0;
        }
        if (currency === 'MRO'){
            return 1;
        }

        return 2;
    }

    getString(totalAmount, currency){
        const amount = (totalAmount/Math.pow(10.0, this.getPow(currency))).toFixed(2);
        return `${amount} ${this.get(currency)}`;
    }
}

let currency = new Currency();
export default currency;