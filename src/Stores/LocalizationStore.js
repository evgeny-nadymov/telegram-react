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
import { initReactI18next } from 'react-i18next';
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

i18n.use(initReactI18next) //.use(LanguageDetector) // passes i18n down to react-i18next
    .init({
        //detection: detection,
        ns: [defaultNamespace, 'local'],
        defaultNS: defaultNamespace,
        fallbackNS: ['local', 'emoji'],
        resources: {
            en: {
                local: {
                    DeletedMessage: 'Deleted message',
                    YourPhone: 'Your Phone',
                    StartText: 'Please confirm your country code and enter your phone number.',
                    Next: 'Next',
                    InvalidPhoneNumber: 'Invalid phone number. Please check the number and try again.',
                    More: 'More',
                    SendMessage: 'Send Message',
                    ChatInfo: 'Chat Info',
                    ChannelInfo: 'Channel Info',
                    Stickers: 'STICKERS',
                    Emoji: 'EMOJI'
                },
                emoji: {
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
                },
                translation: {
                    AppName: 'Telegram',
                    Loading: 'Loading',
                    Connecting: 'Connecting',
                    Updating: 'Updating'
                }
            },
            ru: {
                local: {
                    DeletedMessage: 'Удаленное сообщение',
                    YourPhone: 'Ваш телефон',
                    StartText: 'Пожалуйста, укажите код страны и свой номер телефона.',
                    Next: 'Далее',
                    InvalidPhoneNumber:
                        'Некорректный номер телефона. Пожалуйста, проверьте номер и попробуйте ещё раз.',
                    More: 'Ещё',
                    SendMessage: 'Отправить сообщение',
                    ChatInfo: 'Информация о чате',
                    ChannelInfo: 'Информация о канале',
                    Stickers: 'СТИКЕРЫ',
                    Emoji: 'ЕМОДЗИ'
                },
                emoji: {
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
                },
                translation: {
                    AppName: 'Телеграм',
                    Loading: 'Загрузка',
                    Connecting: 'Соединение',
                    Updating: 'Обновление'
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

const translationDefaultLng = cache.read(defaultLanguage, defaultNamespace, (err, data) => {
    return data;
});
const translationCurrentLng = cache.read(language, defaultNamespace, (err, data) => {
    return data;
});
i18n.addResourceBundle(defaultLanguage, defaultNamespace, translationDefaultLng);
i18n.addResourceBundle(language, defaultNamespace, translationCurrentLng);

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
            case 'updateAuthorizationState': {
                switch (update.authorization_state['@type']) {
                    case 'authorizationStateWaitTdlibParameters':
                        TdLibController.send({
                            '@type': 'setOption',
                            name: 'localization_target',
                            value: { '@type': 'optionValueString', value: 'android' }
                        });
                        TdLibController.send({
                            '@type': 'setOption',
                            name: 'language_pack_id',
                            value: { '@type': 'optionValueString', value: language }
                        });
                        TdLibController.send({
                            '@type': 'getLocalizationTargetInfo',
                            only_local: false
                        }).then(result => {
                            this.info = result;

                            TdLibController.clientUpdate({
                                '@type': 'clientUpdateLanguageChange',
                                language: language
                            });
                        });
                        break;
                }
                break;
            }
            case 'updateLanguagePackStrings': {
                // add/remove new strings

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

                    TdLibController.send({
                        '@type': 'setOption',
                        name: 'language_pack_id',
                        value: { '@type': 'optionValueString', value: language }
                    });

                    this.emit('clientUpdateLanguageChange', update);
                });
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

    loadLanguage = async language => {
        const result = await TdLibController.send({
            '@type': 'getLanguagePackStrings',
            language_pack_id: language,
            keys: []
        });

        const resources = this.processStrings(language, result);

        this.cache.save(language, defaultNamespace, resources);

        i18n.addResourceBundle(language, defaultNamespace, resources);
    };
}

const store = new LocalizationStore();
window.localization = store;
export default store;
