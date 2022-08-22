# WAPI

Simple REST API wrapper for the super awesome [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)

## Setup

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

## Development

With Docker:

```
docker run --name wapi-dev -e DOCKERIZED=1 -p 4000:4000 -d -v $PWD:/home/api wapi:latest
docker exec -u 0 -it wapi-dev bash
```
## API

All APIs require [Basic Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) using the `user` & `password` in `config.json`:

1. **GET** `/`

    Health check

1. **GET** `/qr`

    Get authentication QR code image

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
