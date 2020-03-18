/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

class SidebarManager {
    constructor() {
        this.pages = [];

        document.addEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = event => {
        const { pages } = this;
        if (!pages.length) return;

        switch (event.key) {
            case 'Escape':
                const page = pages[pages.length - 1];
                if (page) {
                    event.preventDefault();
                    event.stopPropagation();

                    const { onClose } = page.props;
                    if (onClose) {
                        event.target.blur();
                        onClose();
                    }
                }
                break;
        }
    };

    add(page) {
        this.pages.push(page);
    }

    remove(page) {
        const index = this.pages.indexOf(page);
        if (index === -1) return;

        this.pages.splice(index, 1);
    }
}

const manager = new SidebarManager();
export default manager;
