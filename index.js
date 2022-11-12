const { createLogger, format, transports } = require("winston");
const Queue = require('better-queue');
const fs = require('fs');
 
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({})],
});

const { createClient, sendMessageAsync } = require('./client');
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

const sendMessage = (input, cb) => {
    logger.info(`sendMessage: ` + JSON.stringify(input))
    sendMessageAsync(client, input)
        .then(() => { cb(null, true)})
        .catch((err) => { cb(err, false)});
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