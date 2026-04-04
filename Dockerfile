FROM node:24-alpine

# Install Chromium.
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy source
WORKDIR /usr/src/app
COPY . .

# install
RUN npm i

CMD ["node","index.js"]
