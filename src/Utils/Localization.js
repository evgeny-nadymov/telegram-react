/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// This file based on https://github.com/DrKLO/Telegram/blob/master/TMessagesProj/src/main/java/org/telegram/messenger/LocaleController.java

export const QuantityEnum = Object.freeze({
    QUANTITY_OTHER: 0x0000,
    QUANTITY_ZERO: 0x0001,
    QUANTITY_ONE: 0x0002,
    QUANTITY_TWO: 0x0004,
    QUANTITY_FEW: 0x0008,
    QUANTITY_MANY: 0x0010
});

export class PluralRules {
    quantityForNumber(count) {
        return undefined;
    }
}

export class PluralRules_Zero {
    quantityForNumber(count) {
        if (count === 0 || count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Welsh {
    quantityForNumber(count) {
        if (count === 0) {
            return QuantityEnum.QUANTITY_ZERO;
        } else if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (count === 2) {
            return QuantityEnum.QUANTITY_TWO;
        } else if (count === 3) {
            return QuantityEnum.QUANTITY_FEW;
        } else if (count === 6) {
            return QuantityEnum.QUANTITY_MANY;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Two {
    quantityForNumber(count) {
        if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (count === 2) {
            return QuantityEnum.QUANTITY_TWO;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Tachelhit {
    quantityForNumber(count) {
        if (count >= 0 && count <= 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (count >= 2 && count <= 10) {
            return QuantityEnum.QUANTITY_FEW;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Slovenian {
    quantityForNumber(count) {
        const rem100 = count % 100;
        if (rem100 === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (rem100 === 2) {
            return QuantityEnum.QUANTITY_TWO;
        } else if (rem100 >= 3 && rem100 <= 4) {
            return QuantityEnum.QUANTITY_FEW;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Romanian {
    quantityForNumber(count) {
        const rem100 = count % 100;
        if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if ((count === 0 || (rem100 >= 1 && rem100 <= 19))) {
            return QuantityEnum.QUANTITY_FEW;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Polish {
    quantityForNumber(count) {
        const rem100 = count % 100;
        const rem10 = count % 10;
        if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) {
            return QuantityEnum.QUANTITY_FEW;
        } else if (rem10 >= 0 && rem10 <= 1 || rem10 >= 5 && rem10 <= 9 || rem100 >= 12 && rem100 <= 14) {
            return QuantityEnum.QUANTITY_MANY;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_One {
    quantityForNumber(count) {
        return count === 1 ? QuantityEnum.QUANTITY_ONE : QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_None {
    quantityForNumber(count) {
        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Maltese {
    quantityForNumber(count) {
        const rem100 = count % 100;
        if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (count === 0 || (rem100 >= 2 && rem100 <= 10)) {
            return QuantityEnum.QUANTITY_FEW;
        } else if (rem100 >= 11 && rem100 <= 19) {
            return QuantityEnum.QUANTITY_MANY;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Macedonian {
    quantityForNumber(count) {
        if (count % 10 === 1 && count !== 11) {
            return QuantityEnum.QUANTITY_ONE;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Lithuanian {
    quantityForNumber(count) {
        const rem100 = count % 100;
        const rem10 = count % 10;
        if (rem10 === 1 && !(rem100 >= 11 && rem100 <= 19)) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (rem10 >= 2 && rem10 <= 9 && !(rem100 >= 11 && rem100 <= 19)) {
            return QuantityEnum.QUANTITY_FEW;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Latvian {
    quantityForNumber(count) {
        if (count === 0) {
            return QuantityEnum.QUANTITY_ZERO;
        } else if (count % 10 === 1 && count % 100 !== 11) {
            return QuantityEnum.QUANTITY_ONE;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Langi {
    quantityForNumber(count) {
        if (count === 0) {
            return QuantityEnum.QUANTITY_ZERO;
        } else if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_French {
    quantityForNumber(count) {
        if (count >= 0 && count < 2) {
            return QuantityEnum.QUANTITY_ONE;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Czech {
    quantityForNumber(count) {
        if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (count >= 2 && count <= 4) {
            return QuantityEnum.QUANTITY_FEW;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Breton {
    quantityForNumber(count) {
        if (count === 0) {
            return QuantityEnum.QUANTITY_ZERO;
        } else if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (count === 2) {
            return QuantityEnum.QUANTITY_TWO;
        } else if (count === 3) {
            return QuantityEnum.QUANTITY_FEW;
        } else if (count === 6) {
            return QuantityEnum.QUANTITY_MANY;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Balkan {
    quantityForNumber(count) {
        const rem100 = count % 100;
        const rem10 = count % 10;
        if (rem10 === 1 && rem100 !== 11) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) {
            return QuantityEnum.QUANTITY_FEW;
        } else if ((rem10 === 0 || (rem10 >= 5 && rem10 <= 9) || (rem100 >= 11 && rem100 <= 14))) {
            return QuantityEnum.QUANTITY_MANY;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Serbian {
    quantityForNumber(count) {
        const rem100 = count % 100;
        const rem10 = count % 10;
        if (rem10 === 1 && rem100 !== 11) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) {
            return QuantityEnum.QUANTITY_FEW;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

export class PluralRules_Arabic {
    quantityForNumber(count) {
        const rem100 = count % 100;
        if (count === 0) {
            return QuantityEnum.QUANTITY_ZERO;
        } else if (count === 1) {
            return QuantityEnum.QUANTITY_ONE;
        } else if (count === 2) {
            return QuantityEnum.QUANTITY_TWO;
        } else if (rem100 >= 3 && rem100 <= 10) {
            return QuantityEnum.QUANTITY_FEW;
        } else if (rem100 >= 11 && rem100 <= 99) {
            return QuantityEnum.QUANTITY_MANY;
        }

        return QuantityEnum.QUANTITY_OTHER;
    }
}

const re = {
    not_string: /[^s]/,
    number: /[diefg]/,
    json: /[j]/,
    not_json: /[^j]/,
    text: /^[^\x25]+/,
    modulo: /^\x25{2}/,
    placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,
    key: /^([a-z_][a-z_\d]*)/i,
    key_access: /^\.([a-z_][a-z_\d]*)/i,
    index_access: /^\[(\d+)\]/,
    sign: /^[\+\-]/
}

export function sprintf() {
    const key = arguments[0], cache = sprintf.cache
    if (!(cache[key] && cache.hasOwnProperty(key))) {
        cache[key] = sprintf.parse(key)
    }
    return sprintf.format.call(null, cache[key], arguments)
}

sprintf.format = function(parse_tree, argv) {
    var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
    for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i])
        if (node_type === "string") {
            output[output.length] = parse_tree[i]
        }
        else if (node_type === "array") {
            match = parse_tree[i] // convenience purposes only
            if (match[2]) { // keyword argument
                arg = argv[cursor]
                for (k = 0; k < match[2].length; k++) {
                    if (!arg.hasOwnProperty(match[2][k])) {
                        throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                    }
                    arg = arg[match[2][k]]
                }
            }
            else if (match[1]) { // positional argument (explicit)
                arg = argv[match[1]]
            }
            else { // positional argument (implicit)
                arg = argv[cursor++]
            }

            if (get_type(arg) == "function") {
                arg = arg()
            }

            if (re.not_string.test(match[8]) && re.not_json.test(match[8]) && (get_type(arg) !== "number" && isNaN(arg))) {
                throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
            }

            if (re.number.test(match[8])) {
                is_positive = arg >= 0
            }

            switch (match[8]) {
                case "b":
                    arg = arg.toString(2)
                    break
                case "c":
                    arg = String.fromCharCode(arg)
                    break
                case "d":
                case "i":
                    arg = parseInt(arg, 10)
                    break
                case "j":
                    arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0)
                    break
                case "e":
                    arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
                    break
                case "f":
                    arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
                    break
                case "g":
                    arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg)
                    break
                case "o":
                    arg = arg.toString(8)
                    break
                case "s":
                    arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
                    break
                case "u":
                    arg = arg >>> 0
                    break
                case "x":
                    arg = arg.toString(16)
                    break
                case "X":
                    arg = arg.toString(16).toUpperCase()
                    break
            }
            if (re.json.test(match[8])) {
                output[output.length] = arg
            }
            else {
                if (re.number.test(match[8]) && (!is_positive || match[3])) {
                    sign = is_positive ? "+" : "-"
                    arg = arg.toString().replace(re.sign, "")
                }
                else {
                    sign = ""
                }
                pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
                pad_length = match[6] - (sign + arg).length
                pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
                output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
            }
        }
    }
    return output.join("")
}

sprintf.cache = {}

sprintf.parse = function(fmt) {
    let _fmt = fmt, match = [], parse_tree = [], arg_names = 0
    while (_fmt) {
        if ((match = re.text.exec(_fmt)) !== null) {
            parse_tree[parse_tree.length] = match[0]
        }
        else if ((match = re.modulo.exec(_fmt)) !== null) {
            parse_tree[parse_tree.length] = "%"
        }
        else if ((match = re.placeholder.exec(_fmt)) !== null) {
            if (match[2]) {
                arg_names |= 1
                var field_list = [], replacement_field = match[2], field_match = []
                if ((field_match = re.key.exec(replacement_field)) !== null) {
                    field_list[field_list.length] = field_match[1]
                    while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                        if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                            field_list[field_list.length] = field_match[1]
                        }
                        else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                            field_list[field_list.length] = field_match[1]
                        }
                        else {
                            throw new SyntaxError("[sprintf] failed to parse named argument key")
                        }
                    }
                }
                else {
                    throw new SyntaxError("[sprintf] failed to parse named argument key")
                }
                match[2] = field_list
            }
            else {
                arg_names |= 2
            }
            if (arg_names === 3) {
                throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
            }
            parse_tree[parse_tree.length] = match
        }
        else {
            throw new SyntaxError("[sprintf] unexpected placeholder")
        }
        _fmt = _fmt.substring(match[0].length)
    }
    return parse_tree
}

export function vsprintf(fmt, argv, _argv) {
    _argv = (argv || []).slice(0)
    _argv.splice(0, 0, fmt)
    return sprintf.apply(null, _argv)
}

/**
 * helpers
 */
function get_type(variable) {
    return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
}

function str_repeat(input, multiplier) {
    return Array(multiplier + 1).join(input)
}

export const sprintfPostprocessor = {
    name: 'sprintf',
    type: 'postProcessor',

    process(value, key, options) {
        if (!options.sprintf) return value;

        if (Object.prototype.toString.apply(options.sprintf) === '[object Array]') {
            return vsprintf(value, options.sprintf);
        } else if (typeof options.sprintf === 'object') {
            return sprintf(value, options.sprintf);
        }

        return value;
    },

    overloadTranslationOptionHandler(args) {
        let values = [];

        for (var i = 1; i < args.length; i++) {
            values.push(args[i]);
        }

        return {
            postProcess: 'sprintf',
            sprintf: values
        };
    }
};