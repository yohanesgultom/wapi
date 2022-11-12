const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrTerminal = require('qrcode-terminal');
const emojis = ['👍', '✅', '💡', '🙂', '🐬', '🚀', '⭐', '🙏🏻'];

const createClient = (isDockerized = false, logger = console) => {

    const options = {
        authStrategy: new LocalAuth(),
    }

    logger.info(`dockerized == ${isDockerized}`);
    if (isDockerized) {
        options['puppeteer'] = {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };
    }

    const client = new Client(options);

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
            logger.info(`chat id: ${chat.id._serialized} name: ${chat.name}`);
            if (!chat.isGroup && chat.name) {
                const emoji = emojis[Math.floor(Math.random()*emojis.length)];
                msg.react(emoji);
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

module.exports = {
    createClient,
    sendMessageAsync,
}