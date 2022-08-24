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
const clientMockDockerized = createClient(true)

describe('client', () => {

    test('should handle qr event', async () => {
        clientMock.emit('qr', 'test')
        expect(clientMock.qr).toBe('test')
        clientMockDockerized.emit('qr', 'foo')
        expect(clientMockDockerized.qr).toBe('foo')
    })

    test('should handle ready event', async () => {
        clientMock.emit('ready')
        expect(clientMock.getState).toBeCalled()
    })

    test('should handle private message event', async () => {
        const chatMock = {
            isGroup: false
        }
        const msgMock = {
            getChat: jest.fn().mockResolvedValueOnce(chatMock),
            react: jest.fn(),
        }
        const clientMock = createClient()
        clientMock.emit('message', msgMock)
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(msgMock.getChat).toBeCalled()
        expect(msgMock.react).toBeCalled()
    })

    test('should handle group message event', async () => {
        const chatMock = {
            isGroup: true
        }
        const msgMock = {
            getChat: jest.fn().mockResolvedValueOnce(chatMock),
            react: jest.fn(),
        }
        const clientMock = createClient()
        clientMock.emit('message', msgMock)
        expect(msgMock.getChat).toBeCalled()
        expect(msgMock.react).not.toBeCalled()
    })

})