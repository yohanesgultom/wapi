FROM node:16-slim

# Install Chromium.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Run everything after as non-privileged user.
RUN mkdir -p /home/api/src
RUN useradd -ms /bin/bash api

WORKDIR /home/api/src
COPY . .

RUN chown -R api:api /home/api
USER api
RUN npm i

# hotfixes
# COPY hotfixes/Client.js /home/api/src/node_modules/whatsapp-web.js/src/Client.js

CMD ["node","index.js"]