FROM node:20-slim

# Install Chromium.
RUN apt-get update -qq \
  && apt-get install -qq --no-install-recommends \
    chromium \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && ln -s /usr/bin/chromium /usr/bin/google-chrome

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
