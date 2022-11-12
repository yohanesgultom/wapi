const request = require('supertest');
const { MessageMedia } = require('whatsapp-web.js');
const { createApp } = require('../app');

const configMock = { user: 'user', password: 'secret' };
const authToken = Buffer.from(configMock.user + ':' + configMock.password).toString('base64');
const clientMock = {};
const queueMock = {};

const app = createApp(clientMock, queueMock, configMock);

describe('GET /', () => {

    test('should reject unauthenticated', async () => {
        // When
        const res = await request(app)
            .get('');
        // Expect
        expect(res.statusCode).toBe(401);
    });

    test('should respond with success', async () => {
        // When
        const res = await request(app)
            .get('')
            .set('Authorization', 'Basic ' + authToken);
        
        // Expect
        expect(res.statusCode).toBe(200);
    });

});

describe('GET /qr', () => {

    test('should respond with QR image', async () => {
        // Given
        clientMock.getState = jest.fn().mockResolvedValue(null);
        clientMock.qr = 'test';

        // When
        const res = await request(app)
            .get('/qr')
            .set('Authorization', 'Basic ' + authToken);
        
        // Expect
        expect(res.statusCode).toBe(200);
        expect(res.type).toBe('image/png');
        expect(res.body.toString('base64').length).toBe(392);
    });

    test('should respond with error if already connected', async () => {
        // Given
        clientMock.getState = jest.fn().mockResolvedValue('CONNECTED');
        clientMock.info = { wid: { user: 'test' } };

        // When
        const res = await request(app)
            .get('/qr')
            .set('Authorization', 'Basic ' + authToken);

        // Expect
        expect(res.statusCode).toBe(403);
        expect(res.type).toBe('application/json');
        expect(res.body).toMatchObject({ error: `Already linked to ${clientMock.info.wid.user}` });
    });

    test('should respond with error if QR is not showing', async () => {
        // Given
        clientMock.getState = jest.fn().mockResolvedValue(null);
        clientMock.qr = undefined;

        // When
        const res = await request(app)
            .get('/qr')
            .set('Authorization', 'Basic ' + authToken);

        // Expect
        expect(res.statusCode).toBe(404);
        expect(res.type).toBe('application/json');
        expect(res.body).toMatchObject({ error: 'No QR found' });
    });

});

describe('POST /send', () => {

    test('should respond with success', async () => {
        // Given
        queueMock.push = jest.fn();
        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        // When
        const payload = {
            number: "6288290764816",
            message: "Hello world 🙏",
            attachments: [{ filename : "hello.txt", mime: "text/plain", content: "aGVsbG8K"}]
        };
        const res = await request(app)
            .post('/send')
            .set('Authorization', 'Basic ' + authToken)
            .send(payload);
        
        // Expect
        expect(res.statusCode).toBe(200);
        expect(res.type).toBe('application/json');
        expect(res.body).toMatchObject({
            message: 'Message to ' + payload.number + ' is succesfully queued',
        });
        expect(queueMock.push).toHaveBeenNthCalledWith(1, payload);
    })

})

describe('GET /groups', () => {

    test('should respond with success', async () => {
        // Given
        const mockChats = [
            { isGroup: false, id: { _serialized: 'person1@c.us' }, name: 'John Doe' },
            { isGroup: true, id: { _serialized: 'group1@g.us' }, name: 'Group 1' }
        ];
        clientMock.getState = jest.fn().mockResolvedValue('CONNECTED');
        clientMock.getChats = jest.fn().mockResolvedValue(mockChats);

        // When
        const res = await request(app)
            .get('/groups')
            .set('Authorization', 'Basic ' + authToken);
        
        // Expect
        expect(res.statusCode).toBe(200);
        expect(res.type).toBe('application/json');
        expect(res.body).toMatchObject([
            { id: mockChats[1].id._serialized, name: mockChats[1].name }
        ]);
    });

    test('should respond with error', async () => {
        // Given
        clientMock.getState = jest.fn().mockResolvedValue(null);

        // When
        const res = await request(app)
            .get('/groups')
            .set('Authorization', 'Basic ' + authToken);
        
        // Expect
        expect(res.statusCode).toBe(500);
        expect(res.type).toBe('application/json');
    });

});
