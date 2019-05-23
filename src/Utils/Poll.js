/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { POLL_OPTION_LENGTH, POLL_QUESTION_LENGTH } from '../Constants';

export function isValidPoll(poll) {
    if (!poll) return false;

    const { question, options } = poll;
    if (!isValidQuestion(question)) return false;

    const noneEmptyOptions = options.filter(x => Boolean(x.text));
    if (noneEmptyOptions.length <= 1) return false;

    return noneEmptyOptions.every(isValidOption);
}

function isValidQuestion(question) {
    if (!question) return false;

    return question.length <= POLL_QUESTION_LENGTH;
}

function isValidOption(option) {
    if (!option) return false;
    if (!option.text) return false;

    return option.text.length <= POLL_OPTION_LENGTH;
}

export function hasPollData(poll) {
    if (!poll) return false;

    const { question, options } = poll;
    if (question) return true;

    return options.some(x => Boolean(x.text));
}
