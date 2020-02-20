class Storage {
    constructor(options) {
        this.store = options.store;
    }

    setItem(key, value) {
        if (!this.store) return;

        try {
            this.store.setItem(key, value);
        } catch (e) {}
    }

    getItem(key, value) {
        if (!this.store) return;

        try {
            return this.store.getItem(key, value);
        } catch (e) {}

        return undefined;
    }
}

function getDefaults() {
    return {
        prefix: 'i18next_res_',
        expirationTime: Infinity,
        versions: {},
        store: window.localStorage
    };
}

class Cache {
    constructor(services, options = {}) {
        this.init(services, options);

        this.type = 'backend';
    }

    init(services, options = {}) {
        this.services = services;
        this.options = { ...getDefaults(), ...this.options, ...options };
        this.storage = new Storage(this.options);
    }

    read(language, namespace, callback) {
        const nowMS = new Date().getTime();

        if (!this.storage.store) {
            return callback(null, null);
        }

        let local = this.storage.getItem(`${this.options.prefix}${language}-${namespace}`);

        if (local) {
            local = JSON.parse(local);
            if (
                // expiration field is mandatory, and should not be expired
                local.i18nStamp &&
                local.i18nStamp + this.options.expirationTime > nowMS &&
                // there should be no language version set, or if it is, it should match the one in translation
                this.options.versions[language] === local.i18nVersion
            ) {
                delete local.i18nVersion;
                delete local.i18nStamp;
                return callback(null, local);
            }
        }

        return callback(null, null);
    }

    save(language, namespace, data) {
        if (this.storage.store) {
            data.i18nStamp = new Date().getTime();

            // language version (if set)
            if (this.options.versions[language]) {
                data.i18nVersion = this.options.versions[language];
            }

            // save
            this.storage.setItem(`${this.options.prefix}${language}-${namespace}`, JSON.stringify(data));
        }
    }
}

Cache.type = 'backend';

export default Cache;
