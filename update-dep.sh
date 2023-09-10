#/bin/bash

npm install --save whatsapp-web.js@$(curl -s GET https://api.github.com/repos/pedroslopez/whatsapp-web.js/releases | jq -r '.[].name' | head -n1)