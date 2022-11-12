const { createLogger, format, transports } = require("winston");
const Queue = require('better-queue');
const fs = require('fs');
 
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({})],
});

const { createClient } = require('./client');
const { createApp } = require('./app');

const configContent = fs.readFileSync('config.json');
const config = JSON.parse(configContent);
const port = config.port || 4000;
const dockerized = process.env.DOCKERIZED == true;

const client = createClient(dockerized, logger);

const isClientConnected = (cb) => {
    client.getState()
        .then((state) => {
            logger.info('state = ' + state);
            cb(null, state == 'CONNECTED');
        })
        .catch((err) => cb(err, false));
}

const sendMessageAsync = async (client, input) => {
    const state = await client.getState();
    if (state != 'CONNECTED') throw `client state is ${state}`;
    let chatId = input.number;
    if (!chatId.endsWith('.us')) {
        chatId += isNaN(chatId) ? '@g.us' : '@c.us';
    }
    const message = input.message;
    await client.sendMessage(chatId, message);
    const attachments = input.attachments;
    if (input.attachments) {
        let timeout = 0;
        let delay = 1000;
        for (let i = 0; i < attachments.length; i++) {
            let a = attachments[i];
            let media = new MessageMedia(a.mime, a.content, a.filename);
            timeout += delay;
            setTimeout(() => { client.sendMessage(chatId, media) }, timeout);
        }
    }
}

const sendMessage = (input, cb) => {
    logger.info(`sendMessage: ` + JSON.stringify(input))
    sendMessageAsync(client, input)
        .then(() => { cb(null, true)})
        .catch((err) => { cb(err, false)})
}

const outgoingMessageQueue = new Queue(sendMessage, {
    store: {
        type: 'sqlite',
        dialect: 'sqlite',
        path: 'db.sqlite'
    },
    precondition: isClientConnected,
    preconditionRetryTimeout: 5000,
    afterProcessDelay: 5000,
    maxRetries: 3, 
    retryDelay: 5000,
})


const app = createApp(client, outgoingMessageQueue, config, logger)
app.listen(port, function (err) {
    if (err) logger.error(err)
    logger.info(`Server listening on ${port}...`)
})