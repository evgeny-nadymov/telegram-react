/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import Cookies from 'universal-cookie';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import LocalStorageBackend from 'i18next-localstorage-backend';
import { reactI18nextModule } from 'react-i18next';
import TdLibController from '../Controllers/TdLibController';

const defaultLanguage = 'en';
const defaultNamespace = 'translation';
const cookies = new Cookies();
const language = cookies.get('i18next') || defaultLanguage;

// const detection = {
//     // order and from where user language should be detected
//     order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
//
//     // keys or params to lookup language from
//     lookupQuerystring: 'lng',
//     lookupCookie: 'i18next',
//     lookupLocalStorage: 'i18nextLng',
//     lookupFromPathIndex: 0,
//     lookupFromSubdomainIndex: 0,
//
//     // cache user language on
//     caches: ['localStorage', 'cookie']
// };

i18n.use(reactI18nextModule) //.use(LanguageDetector) // passes i18n down to react-i18next
    .init({
        //detection: detection,
        resources: {
            en: {
                translation: {
                    AppName: 'Telegram',
                    Loading: 'Loading',
                    Connecting: 'Connecting',
                    Updating: 'Updating',
                    Search: 'Search',
                    NotEmojiFound: 'No Emoji Found',
                    ChooseDefaultSkinTone: 'Choose your default skin tone',
                    SearchResults: 'Search Results',
                    Recent: 'Frequently Used',
                    SmileysPeople: 'Smileys & People',
                    AnimalsNature: 'Animals & Nature',
                    FoodDrink: 'Food & Drink',
                    Activity: 'Activity',
                    TravelPlaces: 'Travel & Places',
                    Objects: 'Objects',
                    Symbols: 'Symbols',
                    Flags: 'Flags',
                    Custom: 'Custom'
                }
            },
            ru: {
                translation: {
                    AppName: 'Телеграм',
                    Loading: 'Загрузка',
                    Connecting: 'Соединение',
                    Updating: 'Обновление',
                    Search: 'Поиск',
                    NotEmojiFound: 'Емодзи не найдены',
                    ChooseDefaultSkinTone: 'Выберите тон кожи по умолчанию',
                    SearchResults: 'Результаты поиска',
                    Recent: 'Часто используемые',
                    SmileysPeople: 'Смайлики и люди',
                    AnimalsNature: 'Животные и природа',
                    FoodDrink: 'Еда и напитки',
                    Activity: 'Активность',
                    TravelPlaces: 'Путешествия и местности',
                    Objects: 'Предметы',
                    Symbols: 'Символы',
                    Flags: 'Флаги',
                    Custom: 'Пользовательские'
                }
            }
        },
        lng: language,
        fallbackLng: defaultLanguage,
        interpolation: {
            escapeValue: false
        },
        react: {
            wait: false
        }
    });

const cache = new LocalStorageBackend(null, {
    enabled: true,
    prefix: 'i18next_res_',
    expirationTime: Infinity
});
const localDefault = cache.read(defaultLanguage, defaultNamespace, (err, data) => {
    return data;
});
const localCurrent = cache.read(language, defaultNamespace, (err, data) => {
    return data;
});

i18n.addResourceBundle(defaultLanguage, defaultNamespace, localDefault);
i18n.addResourceBundle(language, defaultNamespace, localCurrent);

class LocalizationStore extends EventEmitter {
    constructor() {
        super();

        this.i18n = i18n;
        this.cache = cache;

        this.setMaxListeners(Infinity);
        this.addTdLibListener();
    }

    addTdLibListener = () => {
        TdLibController.addListener('update', this.onUpdate);
        TdLibController.addListener('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('update', this.onUpdate);
        TdLibController.removeListener('clientUpdate', this.onClientUpdate);
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateLanguagePackStrings': {
                this.emit('updateLanguagePackStrings', update);
                break;
            }
        }
    };

    onClientUpdate = async update => {
        switch (update['@type']) {
            case 'clientUpdateLanguageChange': {
                const { language } = update;

                TdLibController.send({
                    '@type': 'getLanguagePackStrings',
                    language_pack_id: language,
                    keys: []
                }).then(async result => {
                    const cookies = new Cookies();
                    cookies.set('i18next', language);

                    const resources = this.processStrings(language, result);

                    this.cache.save(language, defaultNamespace, resources);

                    i18n.addResourceBundle(language, defaultNamespace, resources);

                    await i18n.changeLanguage(language);

                    this.emit('clientUpdateLanguageChange', update);
                });
                break;
            }
            case 'clientUpdateLocalizationTargetInfo': {
                this.info = update.info;
                this.emit('clientUpdateLocalizationTargetInfo', update);
                break;
            }
        }
    };

    processStrings = (lng, languagePackStrings) => {
        if (!languagePackStrings) return {};
        const { strings } = languagePackStrings;
        if (!strings) return {};

        let result = {};
        for (let i = 0; i < strings.length; i++) {
            const { value } = strings[i];
            switch (value['@type']) {
                case 'languagePackStringValueOrdinary': {
                    result[strings[i].key] = value.value;
                    break;
                }
                case 'languagePackStringValuePluralized': {
                    //result[strings[i].key] = value.value;
                    break;
                }
                case 'languagePackStringValueDeleted': {
                    break;
                }
            }
        }

        return result;
    };
}

const store = new LocalizationStore();
window.localization = store;
export default store;
