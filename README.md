<div align="center"><h3>Igax</h3></div>

### Interface

![Sample screenshot](/readme/chat.png)

### Steps to run locally

Install [node.js](http://nodejs.org/).

Install dependencies with:

```lang=bash
npm ci
```

This will install all the needed dependencies.

All TDLib files will be installed into node_modules/tdweb/dist/ folder. Manually copy them into the public folder with:

```lang=bash
cp node_modules/tdweb/dist/* public/
```

Run the app in development mode with:

```lang=bash
npm run start
```

Open http://localhost:3000 to view it in the browser.

## Dependency Update (2024)

This project has been updated with modern dependencies to address security vulnerabilities and deprecated packages. Major updates include:

- React 16 → React 18
- Material UI v4 → MUI v5
- Service Worker (sw-precache) → Workbox
- Various outdated libraries and security fixes

For detailed setup instructions, see:

- [SETUP.md](./SETUP.md) - Quick setup guide
- [UPGRADE.md](./UPGRADE.md) - Detailed information about the updates and migration

**Note**: After updating dependencies, some additional code updates may be required to handle breaking changes in React Router v6 and MUI v5.

This project is based on [TelegramWeb](https://github.com/dinesh99639/TelegramWeb), which is itself based on [telegram-react](https://github.com/evgeny-nadymov/telegram-react).

Licensed under GPL-3.0. See LICENSE for details.
