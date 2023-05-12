const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrTerminal = require('qrcode-terminal');
const axios = require('axios');
const { logger } = require('./logger');

const IMAGE_MIMES = ['image/png', 'image/jpg', 'image/jpeg', 'image/bmp', 'image/webp'];
const EMOJIS = ['👍', '✅', '💡', '🙂', '🐬', '🚀', '⭐', '🙏🏻'];
const USER_DATA_PATH = process.env.USER_DATA_PATH;

const createClient = (db, isDockerized = false) => {

    const postOptions = {}

    // use custom path to user data directory if provided
    logger.info(`USER_DATA_PATH = ${USER_DATA_PATH}`);
    if (USER_DATA_PATH) {
        postOptions.authStrategy = new LocalAuth({
            dataPath: USER_DATA_PATH,
        });
    } else {
        postOptions.authStrategy = new LocalAuth();
    }

    // add postOptions when running inside docker
    logger.info(`dockerized = ${isDockerized}`);
    if (isDockerized) {
        postOptions['puppeteer'] = {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };
    }

    const client = new Client(postOptions);

    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        client.qr = qr;
        qrTerminal.generate(qr, { small: true });
    });

    client.on('ready', async () => {
        const state = await client.getState();
        logger.info('Client is ' + state);
    });

    client.on('message', async (msg) => {
        try {
            const chat = await msg.getChat();
            logger.info(`message received`);
            
            // give random reaction
            if (!chat.isGroup && chat.name && '/ping' == msg.body.toLowerCase()) {
                const emoji = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
                msg.react(emoji);
            }

            // debug mentions
            if (chat.isGroup) {
                const mentions = await msg.getMentions();
                logger.info('group', mentions);
                const myContact = mentions.find(contact => contact.isMe);
                if (myContact) {
                    logger.info('we are mentioned!');
                }
            }
            
            // invoke webhooks
            if (db && db.webhooks) {
                const webhooks = await db.webhooks.all();
                for (let i in webhooks) {
                    try {
                        const webhook = webhooks[i];
                        // logger.info('webhook: ' + JSON.stringify(webhook));
                        if (webhook.event_code == 'INCOMING_MESSAGE' && webhook.post_url) {
                            const postOptions = {
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            };
                            if (webhook.auth_header) {
                                postOptions['headers']['Authorization'] = webhook.auth_header;
                            }
                            // no await, let it run in the background
                            await axios.post(webhook.post_url, msg, postOptions);
                        }                       
                    } catch (e) {
                        logger.error(e);
                    }
                }
            }
        } catch (err) {
            logger.error(err);
        }
    });

    client.initialize();

    return client;
}

const sendMessageAsync = async (client, input) => {
    const state = await client.getState();
    if (state != 'CONNECTED') throw `client state is ${state}`;
    if (!input.message) throw `missing message`;

    // adjust destination number's format
    let chatId = input.number;
    if (!chatId.endsWith('.us')) {
        chatId += isNaN(chatId) ? '@g.us' : '@c.us';
    }

    // prepare and send message
    const message = input.message;
    const attachments = input.attachments;
    if (attachments 
            && attachments.length > 0 
            && IMAGE_MIMES.indexOf(attachments[0].mime.toLowerCase()) >= 0) {
        // pop first attachment and send it with message as caption
        const a = attachments.shift();
        await client.sendMessage(
            chatId, 
            new MessageMedia(a.mime, a.content, a.filename), 
            {caption: message}
        );
    } else {
        // otherwise, send message normally
        await client.sendMessage(chatId, message);
    }
    
    // handle remaining attachments
    if (attachments) {
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

module.exports = {
    createClient,
    sendMessageAsync,
}