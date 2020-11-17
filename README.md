# Telegram Web App

### Interface
![Sample screenshot](/src/Assets/Screenshots/1x_Group.png)

### Technical details

The app is based on the ReactJS JavaScript framework and TDLib (Telegram Database library) compiled to WebAssembly. Try it [here](https://evgeny-nadymov.github.io/telegram-react/).

### Running locally
1. **Obtaining Telegram api keys.**

Please visit this [page](https://github.com/telegramdesktop/tdesktop/blob/dev/docs/api_credentials.md) for details.

2. **Setup .env file.**

Manually copy Telegram api keys from previous step into REACT_TELEGRAM_API_ID and REACT_TELEGRAM_API_HASH at .env file.

3. **Install node.js & npm.**
Probably, you should use [nvm](https://github.com/nvm-sh/nvm).

4. **Install dependencies.**

```bash
npm ci
```
All TDLib files will be installed into node_modules/tdweb/dist/ folder. 

5. **Manually copy TDLib files into the public folder.**

```bash
cp node_modules/tdweb/dist/* public/
```

6. **Run the app in development mode.**

```bash
npm run start
```

Open http://localhost:3000 to view it in the browser.

### Deploying to GitHub Pages

1. **Obtaining Telegram api keys.**

Please visit this [page](https://github.com/telegramdesktop/tdesktop/blob/dev/docs/api_credentials.md) for details.

2. **Setup .env file.**

Manually copy Telegram api keys from previous step into REACT_TELEGRAM_API_ID and REACT_TELEGRAM_API_HASH at .env file.

3. **Update *homepage* property at the app's `package.json` file.**

Define its value to be the string `https://{username}.github.io/{repo-name}`, where `{username}` is your GitHub username, and `{repo-name}` is the name of the GitHub repository. Since my GitHub username is `evgeny-nadymov` and the name of my GitHub repository is `telegram-react`, I added the following property:
    
```js
//...
"homepage": "https://evgeny-nadymov.github.io/telegram-react"
```

4. **Generate a *production build* of your app and deploy it to GitHub Pages.**

```bash
npm run deploy
```

### Running in a Docker container

1. **Obtaining Telegram api keys.**

Please visit this [page](https://github.com/telegramdesktop/tdesktop/blob/dev/docs/api_credentials.md) for details.

2. **Provide your Telegram api keys as build arguments.**

```bash
docker build . --build-arg TELEGRAM_API_ID=0000000 --build-arg TELEGRAM_API_HASH=00000000000000000
```

The Docker build will perform all the necessary steps to get a working build of Telegram-React.

### References

1. [Deploying a React App (created using create-react-app) to GitHub Pages](https://github.com/gitname/react-gh-pages)
2. [Facebook's tutorial on deploying a React app to GitHub Pages](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#github-pages)
