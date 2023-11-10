# 🥗 WAPI

![Test](https://github.com/yohanesgultom/wapi/actions/workflows/main.yml/badge.svg?branch=main)

Simple REST API wrapper for the super awesome [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)

> ⚠️ Due to the nature of the `whatsapp-web.js` dependency on WhatsApp Web behaviours, regular maintainance is required (library update, temporary workaround). If you face any unknown issue that is not fixed in this wrapper, consider checking [whatsapp-web.js issue page](https://github.com/pedroslopez/whatsapp-web.js/issues)

## ⚙️ Setup

With Docker:

1. Clone repo
2. Copy `config.example.json` to `config.json` and set desired `user` & `password` (for Basic Authentication) and `port` (for API server)
3. Build: `docker build -t wapi:latest .` 
4. Run: `docker run --name wapi -e DOCKERIZED=1 -p 4000:4000 -d wapi:latest`

Without Docker:

1. Clone repo
2. Copy `config.example.json` to `config.json` and set desired `user` & `password` (for Basic Authentication) and `port` (for API server)
3. Run `npm install`
4. Run `npm start`

## 🛠️ Development

With Docker:

```
docker run --name wapi-dev -e DOCKERIZED=1 -p 4000:4000 -d -v $PWD:/home/api wapi:latest
docker exec -u 0 -it wapi-dev bash
```
## 🍱 API

All APIs require [Basic Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) using the `user` & `password` in `config.json`:

1. **GET** `/`

    Health check

1. **GET** `/qr`

    Get authentication QR code image

1. **GET** `/contacts/:contactId`

    Get contact details by id .eg `6281311525264@c.us`


1. **POST** `/send`

    Send a message to an individual or group chat (`number` can contain phone number with country code or a group id)
    Example:

        {
          "number":"6288290764816",
          "message":"Hello world 🙏",
          "attachments": [{"filename": "hello.txt", "mime":"text/plain", "content":"aGVsbG8K"}]
        }
  
1. **GET** `/groups`

    Get list of groups (id and name) where this account is included

1. **GET** `/webhooks`

    Get all webhooks

1. **POST** `/webhooks`

    Add a webhook:
    Example:

        {
            "postUrl": "http://localhost:4000/test",
            "authHeader": "Basic c2VjcmV0Cg==",
            "eventCode": "INCOMING_MESSAGE"
        }

1. **DELETE** `/webhooks/:id`

    Delete a webhook
