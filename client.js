const { Client, LocalAuth } = require('whatsapp-web.js');
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
        const chat = await msg.getChat();
        logger.info(`chat id: ${chat.id._serialized} name: ${chat.name}`);
        if (!chat.isGroup) {
            const emoji = emojis[Math.floor(Math.random()*emojis.length)];
            msg.react(emoji);
        }
    });

    client.initialize();

    return client;
}

module.exports = {
    createClient
}