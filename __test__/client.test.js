const { Client } = require('whatsapp-web.js')
const { createClient } = require('../client')
const { EventEmitter } = require('events')

jest.mock('whatsapp-web.js')

Client.mockImplementation(() => {
    const client = new EventEmitter()
    client.initialize = jest.fn()
    client.getState = jest.fn()
    return client
})
const clientMock = createClient()

describe('client', () => {

    test('should handle qr event', async () => {
        clientMock.emit('qr', 'test')
        expect(clientMock.qr).toBe('test')
    })

    test('should handle ready event', async () => {
        clientMock.emit('ready')
        expect(clientMock.getState).toBeCalled()
    })

    test('should handle message event', async () => {
        const chatMock = {
            isGroup: false
        }
        const msgMock = {
            getChat: jest.fn().mockResolvedValue(chatMock),
            react: jest.fn().mockResolvedValue(undefined)
        }
        clientMock.emit('message', msgMock)
        expect(msgMock.getChat).toBeCalled()
        // expect(msgMock.react).toBeCalled()
    })

})