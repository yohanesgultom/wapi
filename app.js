const qrImage = require('qr-image')
const express = require('express')
const basicAuth = require('express-basic-auth')
const { MessageMedia } = require('whatsapp-web.js')

const createApp = (client, config) => { 
    const app = express()
    const START_DATE = new Date()

    app.use(express.json({ limit: '100mb' }))

    const basicAuthUsers = {}
    basicAuthUsers[config.user] = config.password
    app.use(basicAuth({ users: basicAuthUsers }))

    app.get('/', async function(_req, res) {
        const now = new Date()
        res.json({
            systemTime: now,
            uptimeSec: Math.round((now.getTime() - START_DATE.getTime()) / 1000),
        })
    })

    app.get('/qr', async function(_req, res) {
        const state = await client.getState()
        console.log(`client state is ${state}`)
        if (state == 'CONNECTED') {
            res.status(403).json({ error: `Already linked to ${client.info.wid.user}` })
        } else if (!client.qr) {
            res.status(404).json({ error: 'No QR found' })
        } else {
            let stream = qrImage.image(client.qr, { type: 'png', ec_level: 'H', size: 5, margin: 0 })
            res.setHeader('Content-type', 'image/png')
            stream.pipe(res)
        }
    })

    app.post('/send', async function(req, res) {
        try {
            const state = await client.getState()
            if (state != 'CONNECTED') throw `client state is ${state}`
            let chatId = req.body.number
            if (!chatId.endsWith('.us')) {
                chatId += isNaN(chatId) ? '@g.us' : '@c.us'
            }
            const message = req.body.message
            await client.sendMessage(chatId, message)
            const attachments = req.body.attachments
            if (req.body.attachments) {
                let timeout = 0
                let delay = 1000
                for (let i = 0; i < attachments.length; i++) {
                    let a = attachments[i]
                    let media = new MessageMedia(a.mime, a.content, a.filename)
                    timeout += delay
                    setTimeout(() => { client.sendMessage(chatId, media) }, timeout)
                }
            }
            return res.json({
                message: 'Message successfully sent to ' + req.body.number,
            })
        } catch (err) {
            console.error(err)
            return res.status(500).json({ error: err.message })
        }
    })

    app.get('/groups', async function(_req, res) {
        try {
            const state = await client.getState()
            if (state != 'CONNECTED') throw `client state is ` + state
            const chats = await client.getChats()
            const groups = chats
                .filter(chat => chat.isGroup)
                .map(chat => {
                    return {
                        id: chat.id._serialized,
                        name: chat.name
                    }
                })
            return res.json(groups)
        } catch (err) {
            console.error(err)
            return res.status(500).json({ error: err.message })
        }
    })

    return app
}

module.exports = {
    createApp
}
