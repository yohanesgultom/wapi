# WAPI

Simple REST API wrapper for super awesome [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)

## API

1. **GET** `/qr`
Get authentication QR code image

2. **POST** `/send`
Send message
Example:
```
{
  "number":"6288290764816",
  "message":"Hello world 🙏",
  "attachments": [{"filename": "hello.txt", "mime":"text/plain", "content":"aGVsbG8K"}]
}
```

