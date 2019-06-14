# Telegram Web App

### Technical details

The app is based on the ReactJS JavaScript framework and TDLib (Telegram Database library) compiled to WebAssembly. Try it [here](https://evgeny-nadymov.github.io/telegram-react/).

### Running locally
Install [node.js](http://nodejs.org/).

Install dependencies with:

```lang=bash
npm install
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