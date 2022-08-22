const { createClient } = require('./client')
const { createApp } = require('./app')

const fs = require('fs')
const configContent = fs.readFileSync('config.json')
const config = JSON.parse(configContent)
const port = config.port || 4000
const dockerized = process.env.DOCKERIZED == true

const client = createClient(dockerized)
const app = createApp(client, config)

app.listen(port, function (err) {
    if (err) console.error(err)
    console.log(`Server listening on ${port}...`)
})