/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import i18n from 'i18next';
import LocalizationCache from '../Localization/Cache';
import { initReactI18next } from 'react-i18next';
import TdLibController from '../Controllers/TdLibController';
import React from 'react';

const fallbackLng = 'en';
const defaultNS = 'translation';
const lng = localStorage.getItem('i18next') || fallbackLng;

i18n.use(initReactI18next).init({
    ns: [defaultNS, 'local'],
    defaultNS,
    fallbackNS: ['auth', 'local', 'emoji', 'settings', 'translation', 'search'],
    resources: {
        en: {
            auth: {
                QRHint: '1. Open Telegram on your phone\n2. Go to Settings > Devices > Scan QR\n3. Scan this image to Log in',
                LogInByPhone: 'Or log in by using your phone number',
                LogInViaQR: 'Quick log in using QR code'
            },
            search: {
                ChatsAndContacts: 'Chats and contacts',
                SearchMessagesIn: 'Search messages in'
            },
            settings: {
                ContactJoinedEnabled: 'Enabled',
                ContactJoinedDisabled: 'Disabled',
                NotificationsEnabled: 'Enabled',
                NotificationsDisabled: 'Disabled',
                PreviewEnabled: 'Enabled',
                PreviewDisabled: 'Disabled',
                BioAbout: 'Any details such as age, occupation or city.\nExample: 23 y.o. designer from San Francisco.',
                Archived: 'Archived',
                Saved: 'Saved',
                EditProfile: 'Edit Profile',
                GeneralSettings: 'General Settings',
                FilterChooseChats: 'Please choose at least one chat for this folder.',
                FilterCreateError: 'Sorry, you can\'t add more than 10 folders.'
            },
            local: {
                CopyMessageLink: 'Copy Message Link',
                DragToReposition: 'Drag to Reposition',
                PollQuizOneRightAnswer: 'Quiz has only one right answer.',
                LeftChannel: 'Left channel',
                LeftGroup: 'Left group',
                EnterPassword: 'Enter a Password',
                YourAccountProtectedWithPassword: 'Your account is protected with an additional password.',
                DeletedMessage: 'Deleted message',
                YourPhone: 'Your Phone',
                SignInToTelegram: 'Sign in to Telegram',
                PhoneNumber: 'Phone Number',
                Country: 'Country',
                KeepMeSignedIn: 'Keep me signed in',
                StartText: 'Please confirm your country code and enter your phone number.',
                Next: 'Next',
                InvalidPhoneNumber: 'Invalid phone number. Please check the number and try again.',
                More: 'More',
                SendFileConfirmation: 'Are you sure you want to send file?',
                SendFilesConfirmation: 'Are you sure you want to send files?',
                SendMessage: 'Send Message',
                ChatInfo: 'Chat Info',
                ChannelInfo: 'Channel Info',
                Stickers: 'STICKERS',
                Emoji: 'EMOJI',
                SelectChatToStartMessaging: 'Please select a chat to start messaging',
                Text: 'Text',
                ViewChannelInfo: 'View channel info',
                ViewGroupInfo: 'View group info',
                ViewProfile: 'View profile',
                GoToMessage: 'Go to message',
                PhotosTitle: 'Photos',
                VideosTitle: 'Videos',
                VoiceTitle: 'Voice messages',
                UpdateDraftConfirmation: 'Are you sure you want to update draft?',
                RecordDeniedTitle: 'Permission Denied',
                RecordDeniedDescription: 'You must allow your browser to access your microphone before being able to record voice notes. Click on the padlock icon next to the URL and then make sure you click Allow in the microphone settings to enable Telegram to access your microphone.',
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
                Connecting: 'Connecting...',
                ConnectingToProxy: 'Connecting to proxy...',
                Loading: 'Loading...',
                Updating: 'Updating...',
                WaitingForNetwork: 'Waiting for network...',
                ContinueOnThisLanguage: 'Continue in English',
                SendAsFile: 'Send as a file',
                SendAsPhoto: 'Send as a photo'
            }
        },

        ru: {
            auth: {
                QRHint: '1. Open Telegram on your phone\n2. Go to Settings > Devices > Scan QR\n3. Scan this image to Log in',
                LogInByPhone: 'Or log in by using your phone number',
                LogInViaQR: 'Quick log in using QR code'
            },
            search: {
                ChatsAndContacts: 'Чаты и контакты',
                SearchMessagesIn: 'Искать сообщения в'
            },
            settings: {
                ContactJoinedEnabled: 'Включено',
                ContactJoinedDisabled: 'Выключено',
                NotificationsEnabled: 'Включены',
                NotificationsDisabled: 'Выключены',
                PreviewEnabled: 'Включено',
                PreviewDisabled: 'Выключено',
                BioAbout:
                    'Любые подробности, например: возраст, род занятий или город.\nПример: 23 года, дизайнер из Санкт-Петербурга.',
                Archived: 'Архив',
                Saved: 'Избранное',
                EditProfile: 'Редактровать профиль',
                GeneralSettings: 'Основные настройки'
            },
            local: {
                CopyMessageLink: 'Копировать ссылку на сообщение',
                DragToReposition: 'Перетащите, чтобы изменить положение',
                PollQuizOneRightAnswer: 'Quiz has only one right answer.',
                LeftChannel: 'Канал покинут',
                LeftGroup: 'Группа покинута',
                EnterPassword: 'Введите пароль',
                YourAccountProtectedWithPassword: 'Ваш аккаунт защищен дополнительным паролем.',
                DeletedMessage: 'Удаленное сообщение',
                YourPhone: 'Ваш телефон',
                SignInToTelegram: 'Вход в Telegram',
                PhoneNumber: 'Телефонный номер',
                Country: 'Страна',
                KeepMeSignedIn: 'Сохранить авторизацию',
                StartText: 'Пожалуйста, укажите код страны и свой номер телефона.',
                Next: 'Далее',
                InvalidPhoneNumber: 'Некорректный номер телефона. Пожалуйста, проверьте номер и попробуйте ещё раз.',
                More: 'Ещё',
                SendFileConfirmation: 'Вы действительно хотите отправить файл?',
                SendFilesConfirmation: 'Вы действительно хотите отправить файлы?',
                SendMessage: 'Отправить сообщение',
                ChatInfo: 'Информация о чате',
                ChannelInfo: 'Информация о канале',
                Stickers: 'СТИКЕРЫ',
                Emoji: 'ЕМОДЗИ',
                SelectChatToStartMessaging: 'Пожалуйста, выберите, кому хотели бы написать',
                Text: 'Текст',
                ViewChannelInfo: 'Информация о канале',
                ViewGroupInfo: 'Информация о группе',
                ViewProfile: 'Показать профиль',
                GoToMessage: 'Перейти к сообщению',
                PhotosTitle: 'Фотографии',
                VideosTitle: 'Видеозаписи',
                VoiceTitle: 'Голосовые сообщения',
                UpdateDraftConfirmation: 'Вы действительно хотите обновить черновик сообщения?'
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
                AppName: 'Telegram',
                Connecting: 'Соединение...',
                ConnectingToProxy: 'Подключение к прокси...',
                Loading: 'Загрузка...',
                Updating: 'Обновление...',
                WaitingForNetwork: 'Ожидание сети...',
                ContinueOnThisLanguage: 'Продолжить на русском',
                SendAsFile: 'Отправить как файл',
                SendAsPhoto: 'Отправить как фото'
            }
        },

        it: {
            auth: {
                QRHint: '1. Open Telegram on your phone\n2. Go to Settings > Devices > Scan QR\n3. Scan this image to Log in',
                LogInByPhone: 'Or log in by using your phone number',
                LogInViaQR: 'Quick log in using QR code'
            },
            search: {
                ChatsAndContacts: 'Chat e contatti',
                SearchMessagesIn: 'Cerca messaggi in'
            },
            settings: {
                ContactJoinedEnabled: 'Attivato',
                ContactJoinedDisabled: 'Disattivato',
                NotificationsEnabled: 'Attivate',
                NotificationsDisabled: 'Disattivate',
                PreviewEnabled: 'Attivata',
                PreviewDisabled: 'Disattivata',
                BioAbout: 'Qualsiasi dettaglio come età, lavoro o città.\nEsempio: Designer di 23 anni da San Francisco.',
                Archived: 'Chat archiviate',
                Saved: 'Messaggi salvati',
                EditProfile: 'Modifica profilo',
                GeneralSettings: 'Impostazioni generali'
            },
            local: {
                CopyMessageLink: 'Copia link messaggio',
                DragToReposition: 'Trascina per riposizionare',
                PollQuizOneRightAnswer: 'Il quiz ha solo una risposta esatta.',
                LeftChannel: 'Canale abbandonato',
                LeftGroup: 'Gruppo abbandonato',
                EnterPassword: 'Inserisci password',
                YourAccountProtectedWithPassword: 'Il tuo account è protetto con una password aggiuntiva.',
                DeletedMessage: 'Messaggi cancellati',
                YourPhone: 'Il tuo numero',
                SignInToTelegram: 'Accedi a Telegram',
                PhoneNumber: 'Numero di telefono',
                Country: 'Paese',
                KeepMeSignedIn: 'Mantieni l\'accesso',
                StartText: 'Conferma il prefisso internazionale e inserisci il tuo numero di telefono.',
                Next: 'Avanti',
                InvalidPhoneNumber: 'Numero di telefono non valido. Per favore controlla il numero e riprova.',
                More: 'Altro',
                SendFileConfirmation: 'Sei sicuro di voler mandare il file?',
                SendFilesConfirmation: 'Sei sicuro di voler mandare i file?',
                SendMessage: 'Invia messaggio',
                ChatInfo: 'Info chat',
                ChannelInfo: 'Info canale',
                Stickers: 'STICKER',
                Emoji: 'EMOJI',
                SelectChatToStartMessaging: 'Seleziona una chat per iniziare a messaggiare',
                Text: 'Testo',
                ViewChannelInfo: 'Visualizza info canale',
                ViewGroupInfo: 'Visualizza info gruppo',
                ViewProfile: 'Visualizza profilo',
                GoToMessage: 'Vai al messaggio',
                PhotosTitle: 'Foto',
                VideosTitle: 'Video',
                VoiceTitle: 'Messaggi vocali',
                UpdateDraftConfirmation: 'Sei sicuro di voler aggiornare la bozza?'
            },
            emoji: {
                Search: 'Cerca',
                NotEmojiFound: 'Emoji non trovato',
                ChooseDefaultSkinTone: 'Scegli ',
                SearchResults: 'Risultati di ricerca',
                Recent: 'Usati di recente',
                SmileysPeople: 'Faccine e Persone',
                AnimalsNature: 'Animali e Natura',
                FoodDrink: 'Cibo e Bevande',
                Activity: 'Attività',
                TravelPlaces: 'Viaggi e Luoghi',
                Objects: 'Oggetti',
                Symbols: 'Simboli',
                Flags: 'Bandiere',
                Custom: 'Custom'
            },
            translation: {
                AppName: 'Telegram',
                Connecting: 'Connetto...',
                ConnectingToProxy: 'Connetto al proxy...',
                Loading: 'Carico...',
                Updating: 'Aggiorno...',
                WaitingForNetwork: 'Attendo la rete...',
                ContinueOnThisLanguage: 'Continue in English',
                SendAsFile: 'Invia come file',
                SendAsPhoto: 'Invia come immagine'
            }
        },

        es: {
            auth: {
                QRHint: '1. Open Telegram on your phone\n2. Go to Settings > Devices > Scan QR\n3. Scan this image to Log in',
                LogInByPhone: 'Or log in by using your phone number',
                LogInViaQR: 'Quick log in using QR code'
            },
            search: {
                ChatsAndContacts: 'Chats y contactos',
                SearchMessagesIn: 'Buscar mensajes en'
            },
            settings: {
                ContactJoinedEnabled: 'Activado',
                ContactJoinedDisabled: 'Desactivado',
                NotificationsEnabled: 'Activadas',
                NotificationsDisabled: 'Desactivadas',
                PreviewEnabled: 'Activada',
                PreviewDisabled: 'Desactivada',
                BioAbout: 'Datos como la edad, ocupación o ciudad. Ejemplo: Diseñador de Chicago. 23 años.',
                Archived: 'Archivados',
                Saved: 'Guardados',
                EditProfile: 'Editar perfil',
                GeneralSettings: 'General'
            },
            local: {
                CopyMessageLink: 'Copiar enlace del mensaje',
                DragToReposition: 'Arrastra para posicionar',
                PollQuizOneRightAnswer: 'Un cuestionario tiene sólo una respuesta correcta.',
                LeftChannel: 'Salió del canal',
                LeftGroup: 'Salió del grupo',
                EnterPassword: 'Pon una contraseña',
                YourAccountProtectedWithPassword: 'Tu cuenta está protegida con una contraseña adicional.',
                DeletedMessage: 'Mensaje eliminado',
                YourPhone: 'Tu teléfono',
                SignInToTelegram: 'Iniciar sesión en Telegram',
                PhoneNumber: 'Número de teléfono',
                Country: 'País',
                KeepMeSignedIn: 'Recordarme',
                StartText: 'Por favor, confirma el código de tu país y pon tu número de teléfono.',
                Next: 'Siguiente',
                InvalidPhoneNumber: 'Número de teléfono inválido. Por favor, revisa el número y reinténtalo.',
                More: 'Más',
                SendFileConfirmation: '¿Quieres enviar el archivo?',
                SendFilesConfirmation: '¿Quieres enviar los archivos?',
                SendMessage: 'Enviar mensaje',
                ChatInfo: 'Info. del chat',
                ChannelInfo: 'Info. del canal',
                Stickers: 'STICKERS',
                Emoji: 'EMOJIS',
                SelectChatToStartMessaging: 'Elige un chat para comenzar',
                Text: 'Texto',
                ViewChannelInfo: 'Ver info. del canal',
                ViewGroupInfo: 'Ver info. del grupo',
                ViewProfile: 'Ver perfil',
                GoToMessage: 'Ir al mensaje',
                PhotosTitle: 'Fotos',
                VideosTitle: 'Videos',
                VoiceTitle: 'Mensajes de voz',
                UpdateDraftConfirmation: '¿Quieres actualizar el borrador?'
            },
            emoji: {
                Search: 'Buscar',
                NotEmojiFound: 'No se encontraron emojis',
                ChooseDefaultSkinTone: 'Elige el tono de piel por defecto',
                SearchResults: 'Resultados de búsqueda',
                Recent: 'Uso frecuente',
                SmileysPeople: 'Emoticonos y personas',
                AnimalsNature: 'Animales y naturaleza',
                FoodDrink: 'Comida y bebida',
                Activity: 'Actividad',
                TravelPlaces: 'Viajes y destinos',
                Objects: 'Objetos',
                Symbols: 'Símbolos',
                Flags: 'Banderas',
                Custom: 'Personalizado'
            },
            translation: {
                AppName: 'Telegram',
                Connecting: 'Conectando...',
                ConnectingToProxy: 'Conectando al proxy...',
                Loading: 'Cargando...',
                Updating: 'Actualizando...',
                WaitingForNetwork: 'Esperando red...',
                ContinueOnThisLanguage: 'Continuar en español',
                SendAsFile: 'Enviar como archivo',
                SendAsPhoto: 'Enviar como foto'
            }
        },

        pl: {
            auth: {
                QRHint: '1. Otwórz Telegram na swoim telefonie\n2. Przejdź do Ustawienia » Urządzenia » Zeskanuj kod QR\n3. Zeskanuj ten obraz, aby się zalogować',
                LogInByPhone: 'Lub zaloguj się, używając swojego numeru telefonu',
                LogInViaQR: 'Szybkie logowanie przy użyciu kodu QR'
            },
            search: {
                ChatsAndContacts: 'Czaty i kontakty',
                SearchMessagesIn: 'Szukaj wiadomości w'
            },
            settings: {
                ContactJoinedEnabled: 'Włączone',
                ContactJoinedDisabled: 'Wyłączone',
                NotificationsEnabled: 'Włączone',
                NotificationsDisabled: 'Wyłączone',
                PreviewEnabled: 'Włączony',
                PreviewDisabled: 'Wyłączony',
                BioAbout: 'Różne szczegóły takie jak wiek, zawód lub miasto.\nPrzykład: 23 lata, projektant z Warszawy.',
                Archived: 'Zarchiwizowane',
                Saved: 'Zapisane',
                EditProfile: 'Edytuj profil',
                GeneralSettings: 'Ustawienia ogólne',
                FilterChooseChats: 'Wybierz co najmniej jeden czat dla tego folderu.',
                FilterCreateError: 'Nie można dodać więcej niż 10 folderów.'
            },
            local: {
                CopyMessageLink: 'Kopiuj link wiadomości',
                DragToReposition: 'Przeciągnij, aby zmienić położenie',
                PollQuizOneRightAnswer: 'Quiz ma tylko jedną poprawną odpowiedź.',
                LeftChannel: 'Opuszczono kanał',
                LeftGroup: 'Opuszczono grupę',
                EnterPassword: 'Wprowadź hasło',
                YourAccountProtectedWithPassword: 'Twoje konto jest zabezpieczone dodatkowym hasłem.',
                DeletedMessage: 'Usunięta wiadomość',
                YourPhone: 'Twój numer telefonu',
                SignInToTelegram: 'Zaloguj się do Telegrama',
                PhoneNumber: 'Numer telefonu',
                Country: 'Kraj',
                KeepMeSignedIn: 'Nie wylogowuj mnie',
                StartText: 'Potwierdź kod twojego kraju i podaj swój numer telefonu.',
                Next: 'Dalej',
                InvalidPhoneNumber: 'Nieprawidłowy numer telefonu. Sprawdź numer i spróbuj ponownie.',
                More: 'Więcej',
                SendFileConfirmation: 'Czy na pewno chcesz wysłać plik?',
                SendFilesConfirmation: 'Czy na pewno chcesz wysłać pliki?',
                SendMessage: 'Wyślij wiadomość',
                ChatInfo: 'Info o grupie',
                ChannelInfo: 'Info o kanale',
                Stickers: 'NAKLEJKI',
                Emoji: 'EMOJI',
                SelectChatToStartMessaging: 'Wybierz czat, aby rozpocząć rozmowę',
                Text: 'Tekst',
                ViewChannelInfo: 'Pokaż info o kanale',
                ViewGroupInfo: 'Pokaż info o grupie',
                ViewProfile: 'Pokaż profil',
                GoToMessage: 'Idź do wiadomości',
                PhotosTitle: 'Zdjęcia',
                VideosTitle: 'Wideo',
                VoiceTitle: 'Wiadomości głosowe',
                UpdateDraftConfirmation: 'Czy na pewno chcesz zaktualizować wersję roboczą?',
                RecordDeniedTitle: 'Odmowa dostępu',
                RecordDeniedDescription: 'Zanim będzie można nagrywać notatki głosowe, należy zezwolić przeglądarce na dostęp do mikrofonu. Kliknij na ikonę kłódki obok adresu URL, a następnie upewnij się, że jest wybrane Zezwól w ustawieniach mikrofonu, aby umożliwić dostęp do twojego mikrofonu.'
            },
            emoji: {
                Search: 'Szukaj',
                NotEmojiFound: 'Nie znaleziono emoji',
                ChooseDefaultSkinTone: 'Wybierz domyślny odcień skóry',
                SearchResults: 'Wyniki wyszukiwania',
                Recent: 'Często używane',
                SmileysPeople: 'Uśmieszki i ludzie',
                AnimalsNature: 'Zwierzęta i natura',
                FoodDrink: 'Jedzenie i picie',
                Activity: 'Aktywność',
                TravelPlaces: 'Podróże i miejsca',
                Objects: 'Obiekty',
                Symbols: 'Symbole',
                Flags: 'Flagi',
                Custom: 'Własne'
            },
            translation: {
                AppName: 'Telegram',
                Connecting: 'Łączenie…',
                ConnectingToProxy: 'Łączenie z proxy…',
                Loading: 'Wczytywanie…',
                Updating: 'Aktualizowanie…',
                WaitingForNetwork: 'Czekam na sieć…',
                ContinueOnThisLanguage: 'Kontynuuj po angielsku',
                SendAsFile: 'Wyślij jako plik',
                SendAsPhoto: 'Wyślij jako zdjęcie'
            }
        },
    },
    lng,
    fallbackLng,
    interpolation: {
        escapeValue: false
    },
    react: {
        wait: false
    }
});

const cache = new LocalizationCache(null, {
    enabled: true,
    prefix: 'i18next_res_',
    expirationTime: Infinity
});

const defaultResources = cache.read(fallbackLng, defaultNS, (err, data) => data);
const currentResources = cache.read(lng, defaultNS, (err, data) => data);

i18n.addResourceBundle(fallbackLng, defaultNS, defaultResources);
i18n.addResourceBundle(lng, defaultNS, currentResources);

class LocalizationStore extends EventEmitter {
    constructor() {
        super();

        this.fallbackLng = fallbackLng;
        this.i18n = i18n;
        this.cache = cache;

        this.addTdLibListener();
    }

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    onUpdate = async update => {
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
                            value: { '@type': 'optionValueString', value: lng }
                        });

                        this.info = await TdLibController.send({
                            '@type': 'getLocalizationTargetInfo',
                            only_local: false
                        });

                        TdLibController.clientUpdate({
                            '@type': 'clientUpdateLanguageChange',
                            language: lng
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

                await this.loadLanguage(language);

                localStorage.setItem('i18next', language);

                await i18n.changeLanguage(language);

                TdLibController.send({
                    '@type': 'setOption',
                    name: 'language_pack_id',
                    value: { '@type': 'optionValueString', value: language }
                });

                this.emit('clientUpdateLanguageChange', update);
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
                    if (value.zero_value) {
                        result[strings[i].key + 'Z'] = value.zero_value;
                    }
                    if (value.one_value) {
                        result[strings[i].key + 'O'] = value.one_value;
                    }
                    if (value.two_value) {
                        result[strings[i].key + 'T'] = value.two_value;
                    }
                    if (value.few_value) {
                        result[strings[i].key + 'F'] = value.few_value;
                    }
                    if (value.many_value) {
                        result[strings[i].key + 'M'] = value.many_value;
                    }
                    if (value.other_value) {
                        result[strings[i].key + 'OT'] = value.other_value;
                    }
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
        this.cache.save(language, defaultNS, resources);
        i18n.addResourceBundle(language, defaultNS, resources);
    };
}

const store = new LocalizationStore();
window.localization = store;
export default store;
