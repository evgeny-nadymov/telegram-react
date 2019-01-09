/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Cookies from 'universal-cookie';
import i18n from 'i18next';
import { reactI18nextModule, I18nextProvider } from 'react-i18next';
import { getDisplayName } from './Utils/HOC';
import ApplicationStore from './Stores/ApplicationStore';

const cookies = new Cookies();
const { language } = cookies.get('languageOptions') || { language: 'en' };

i18n.use(reactI18nextModule) // passes i18n down to react-i18next
    .init({
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
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

function withLanguage(WrappedComponent) {
    class LanguageWrapper extends React.Component {
        componentDidMount() {
            ApplicationStore.on('clientUpdateLanguageChanging', this.onClientUpdateLanguageChanging);
        }

        componentWillUnmount() {
            ApplicationStore.removeListener('clientUpdateLanguageChanging', this.onClientUpdateLanguageChanging);
        }

        onClientUpdateLanguageChanging = async update => {
            const { language } = update;

            const cookies = new Cookies();
            cookies.set('languageOptions', { language: language });

            await i18n.changeLanguage(language);

            ApplicationStore.emit('clientUpdateLanguageChange');
        };

        render() {
            return (
                <I18nextProvider i18n={i18n}>
                    <WrappedComponent {...this.props} />
                </I18nextProvider>
            );
        }
    }
    LanguageWrapper.displayName = `WithLanguage(${getDisplayName(WrappedComponent)})`;

    return LanguageWrapper;
}

export default withLanguage;
