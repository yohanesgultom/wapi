const qrImage = require('qr-image');
const express = require('express');
const basicAuth = require('express-basic-auth');

const createApp = (client, outgoingMessageQueue, config, db, logger = console) => { 
    const app = express();
    const START_DATE = new Date();

    app.use(express.json({ limit: '100mb' }));

    const basicAuthUsers = {};
    basicAuthUsers[config.user] = config.password;
    app.use(basicAuth({ users: basicAuthUsers }));

    app.get('/', async function(_req, res) {
        const now = new Date();
        res.json({
            systemTime: now,
            uptimeSec: Math.round((now.getTime() - START_DATE.getTime()) / 1000),
        });
    });

    app.get('/qr', async function(_req, res) {
        const state = await client.getState();
        logger.info(`client state is ${state}`);
        if (state == 'CONNECTED') {
            res.status(403).json({ error: `Already linked to ${client.info.wid.user}` });
        } else if (!client.qr) {
            res.status(404).json({ error: 'No QR found' });
        } else {
            let stream = qrImage.image(client.qr, { type: 'png', ec_level: 'H', size: 5, margin: 0 });
            res.setHeader('Content-type', 'image/png');
            stream.pipe(res);
        }
    });

    app.post('/send', async function(req, res) {
        try {
            outgoingMessageQueue.push(req.body);
            res.json({
                message: 'Message to ' + req.body.number + ' is succesfully queued',
            });
        } catch (err) {
            logger.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/groups', async function(_req, res) {
        try {
            const state = await client.getState();
            if (state != 'CONNECTED') throw `client state is ` + state;
            const chats = await client.getChats();
            const groups = chats
                .filter(chat => chat.isGroup)
                .map(chat => {
                    return {
                        id: chat.id._serialized,
                        name: chat.name
                    }
                });
            res.json(groups);
        } catch (err) {
            logger.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/test', async function(req, res) {
        try {
            logger.info('/test invoked:' + JSON.stringify(req.body));
            res.json(req.body);
        } catch (err) {
            logger.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/webhooks', async function(_req, res) {
        try {
            res.json(await db.webhooks.all());
        } catch (err) {
            logger.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/webhooks', async function(req, res) {
        try {
            await db.webhooks.create({
                postUrl: req.body.postUrl,
                authHeader: req.body.authHeader,
                eventCode: req.body.eventCode,
            });
            res.status(201).json({
                message: 'Webhook created: ' + req.body.postUrl,
            });
        } catch (err) {
            logger.error(err);
            res.status(500).json({ error: err.message });
        }
    });


    app.delete('/webhooks/:id', async function(req, res) {
        try {
            await db.webhooks.delete(req.params.id);
            res.status(200).json({
                message: 'Webhook deleted: ' + req.params.id,
            });
        } catch (err) {
            logger.error(err);
            res.status(500).json({ error: err.message });
        }
    });


    return app;
}

module.exports = {
    createApp
}
