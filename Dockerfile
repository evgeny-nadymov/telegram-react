FROM node:14 AS build

WORKDIR /app/

# Copy over package.json and package-lock.json and install dependencies first,
# so that we don't need to re-download dependencies if they have not been modified.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN cp -v node_modules/tdweb/dist/* public/

ARG TELEGRAM_API_ID
ENV REACT_APP_TELEGRAM_API_ID=${TELEGRAM_API_ID}
ARG TELEGRAM_API_HASH
ENV REACT_APP_TELEGRAM_API_HASH=${TELEGRAM_API_HASH}

RUN npm run build

FROM nginx:stable

WORKDIR /usr/share/nginx/html/
COPY --from=build /app/build/ .

# Hack to get around the hardcoded folder structure without requiring the user to
# go to /telegram-react in their browser
RUN ln -s . telegram-react
