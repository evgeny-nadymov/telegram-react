/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import punycode from './Punycode';

export function getHref(url, mail) {
    if (!url) return null;

    if (mail) return url.startsWith('mailto:') ? url : 'mailto:' + url;

    // if (url.startsWith('tg://')) return url;

    return url.startsWith('http') ? url : 'http://' + url;
}

export function isUrlSafe(displayText, url) {
    if (displayText && displayText !== url) {
        return false;
    }

    if (hasRTLOSymbol(url)) {
        return false;
    }

    return true;
}

export function getDecodedUrl(url, mail) {
    if (!url) return null;

    const href = getHref(url, mail);

    try {
        let decodedHref = decodeURI(href);

        const domain = decodedHref.match(/^https?:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i)[1];
        decodedHref = decodedHref.replace(domain, punycode.ToUnicode(domain));

        return decodedHref;
    } catch (error) {
        console.log('SafeLink.getDecodedUrl error ', url, error);
    }

    return null;
}

const regExpRTLO = /\u202e/;

export function hasRTLOSymbol(url) {
    if (!url) return false;

    return regExpRTLO.test(url);
}

const regExpDomainExplicit = new RegExp(
    '(?:([a-zA-Z]+):\\/\\/)((?:[A-Za-z' +
        '\xD0\x90-\xD0\xAF\xD0\x81' +
        '\xD0\xB0-\xD1\x8F\xD1\x91' +
        '0-9\\-\\_]+\\.){0,10}([A-Za-z' +
        '\xD1\x80\xD1\x84' +
        '\\-\\d]{2,22})(\\:\\d+)?)'
);
const regExpDomain = new RegExp(
    '(?:([a-zA-Z]+):\\/\\/)?((?:[A-Za-z' +
        '\xD0\x90-\xD0\xAF\xD0\x81' +
        '\xD0\xB0-\xD1\x8F\xD1\x91' +
        '0-9\\-\\_]+\\.){1,10}([A-Za-z' +
        '\xD1\x80\xD1\x84' +
        '\\-\\d]{2,22})(\\:\\d+)?)'
);
const regExpProtocol = new RegExp('^([a-zA-Z]+):\\/\\/');

// https://github.com/telegramdesktop/tdesktop/blob/4e80d54be130eca76129f2c4995fe685d1014442/Telegram/SourceFiles/base/qthelp_url.cpp#L105
export function validateUrl(value) {
    // value = punycode.ToASCII(value);

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const match = trimmed.match(regExpDomainExplicit);
    if (!match) {
        const domainMatch = trimmed.match(regExpDomain);
        if (!domainMatch || domainMatch.index !== 0) {
            return null;
        }

        return 'http://' + trimmed;
    } else if (match.index !== 0) {
        return null;
    }

    const protocolMatch = trimmed.match(regExpProtocol);
    return protocolMatch && isGoodProtocol(protocolMatch[0]) ? trimmed : null;
}

function isGoodProtocol(value) {
    return ['http', 'https', 'tg'].some(x => value.toLowerCase().indexOf(x) === 0);
}
