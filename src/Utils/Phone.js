/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

let data = null;
export async function loadData() {
    if (data) return;

    try {
        const response = await fetch('data/countries.txt');
        const text = await response.text();

        const lines = text.split('\n');
        const data2 = [];
        lines.forEach(x => {
            const split = x.split(';');
            const item = {
                prefix: split[0],
                code: split[1],
                name: split[2],
                pattern: split[3],
                count: Number(split[4]),
                emoji: split[5]
            };
            data2.push(item);
        });
        data2.forEach(x => {
            x.phone = '+' + x.prefix;
        });

        data = data2.filter(x => x.emoji);

        return data;
    } catch (error) {
        console.error(error);
    }
}

function clearPhone(phone) {
    if (!phone) return phone;

    return phone
        .replace(/ /g, '')
        .replace('+', '')
        .toLowerCase();
}

function isPhoneWithOptionCode(phone, option) {
    if (!phone) return false;
    if (!option) return false;

    phone = clearPhone(phone);
    const code = clearPhone(option.phone);

    return phone.startsWith(code) && option.pattern;
}

function getCountryFromPhone(phone, data) {
    if (!data) return null;

    const index = data.findIndex(x => isPhoneWithOptionCode(phone, x));

    return index !== -1 ? data[index] : null;
}

function formatByPattern(phone, pattern) {
    phone = clearPhone(phone);

    let result = '';
    let index = 0;
    for (let i = 0; i < pattern.length && index < phone.length; i++) {
        if (pattern[i] >= '0' && pattern[i] <= '9') {
            result += pattern[i];
            if (phone[index] === pattern[i]) {
                index++;
            }
        } else if (pattern[i] === ' ') {
            result += pattern[i];
        } else if (pattern[i] === 'X') {
            result += phone[index++];
        }
    }

    result += ' ' + phone.substring(index);

    return '+' + result;
}

export function formatPhoneNumber(phone) {
    if (!phone) return phone;
    if (!data) return phone.startsWith('+') ? phone : '+' + phone;

    const country = getCountryFromPhone(phone, data);
    if (!country) return phone.startsWith('+') ? phone : '+' + phone;

    return formatByPattern(phone, country.pattern);
}
