/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import OptionStore from '../Stores/OptionStore';

let cyrillicInput = null;

function getCyrillicInputMap() {
    return new Map([
        ['q', 'й'],
        ['w', 'ц'],
        ['e', 'у'],
        ['r', 'к'],
        ['t', 'е'],
        ['y', 'н'],
        ['u', 'г'],
        ['i', 'ш'],
        ['o', 'щ'],
        ['p', 'з'],
        ['[', 'х'],
        [']', 'ъ'],
        ['a', 'ф'],
        ['s', 'ы'],
        ['d', 'в'],
        ['f', 'а'],
        ['g', 'п'],
        ['h', 'р'],
        ['j', 'о'],
        ['k', 'л'],
        ['l', 'д'],
        [';', 'ж'],
        ["'", 'э'],
        ['\\', 'ё'],
        ['z', 'я'],
        ['x', 'ч'],
        ['c', 'с'],
        ['v', 'м'],
        ['b', 'и'],
        ['n', 'т'],
        ['m', 'ь'],
        [',', 'б'],
        ['.', 'ю']
    ]);
}

function isCyrillicPackId(packId) {
    if (!packId) return false;

    const { value } = packId;
    if (!value) return false;

    return value.value === 'ru';
}

function getCyrillicInput(input) {
    if (!input) return null;
    if (!input.length) return null;

    const currentPackId = OptionStore.get('language_pack_id');
    const suggestedPackId = OptionStore.get('suggested_language_pack_id');
    const hasCyrillicPackId = isCyrillicPackId(currentPackId) || isCyrillicPackId(suggestedPackId);
    if (!hasCyrillicPackId) return null;

    cyrillicInput = cyrillicInput || getCyrillicInputMap();

    let output = '';
    for (let i = 0; i < input.length; i++) {
        if (cyrillicInput.has(input[i])) {
            output += cyrillicInput.get(input[i]);
        } else {
            return null;
        }
    }

    return output === '' ? null : output;
}

let latinInput = null;

function getLatinInputMap() {
    return new Map([
        ['й', 'q'],
        ['ц', 'w'],
        ['у', 'e'],
        ['к', 'r'],
        ['е', 't'],
        ['н', 'y'],
        ['г', 'u'],
        ['ш', 'i'],
        ['щ', 'o'],
        ['з', 'p'],
        ['х', '['],
        ['ъ', ']'],
        ['ф', 'a'],
        ['ы', 's'],
        ['в', 'd'],
        ['а', 'f'],
        ['п', 'g'],
        ['р', 'h'],
        ['о', 'j'],
        ['л', 'k'],
        ['д', 'l'],
        ['ж', ';'],
        ['э', "'"],
        ['ё', '\\'],
        ['я', 'z'],
        ['ч', 'x'],
        ['с', 'c'],
        ['м', 'v'],
        ['и', 'b'],
        ['т', 'n'],
        ['ь', 'm'],
        ['б', ','],
        ['ю', '.']
    ]);
}

function getLatinInput(input) {
    if (!input) return null;
    if (!input.length) return null;

    latinInput = latinInput || getLatinInputMap();

    let output = '';
    for (let i = 0; i < input.length; i++) {
        if (latinInput.has(input[i])) {
            output += latinInput.get(input[i]);
        } else {
            return null;
        }
    }

    return output === '' ? null : output;
}

export { getCyrillicInput, getLatinInput };
