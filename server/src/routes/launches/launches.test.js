const request = require('supertest');
const app = require('../../app');
const { 
    mongoConnect, 
    mongoDisconnect 
} = require('../../services/mongo');

describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
    });

    afterAll(async() => {
        await mongoDisconnect();
    });

    describe('Test GET /launches', () => {
        test('It Should respond with 200 success', async () => {
            const response = await request(app)
                .get('/v1/launches')
                .expect('Content-Type',/json/)
                .expect(200);
            expect(response.statusCode).toBe(200);
        });
    });
    
    describe('Test POST /launch', () => {
        const launchData = {
            mission:'Kepler Exploration X',
            rocket : 'Explorer IS1',
            launchDate: new Date('December 27, 2030'),
            target: 'Kepler-442 b',
        };
    
        const launchDataInvalidDate = {
            mission:'Kepler Exploration X',
            rocket : 'Explorer IS1',
            launchDate: 'asd',
            target: 'Kepler-442 b',
        };
    
        const launchDataNoDate = {
            mission:'Kepler Exploration X',
            rocket : 'Explorer IS1',
            target: 'Kepler-442 b',
        };
        
        test('It should respond with 201 success', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchData)
                .expect('Content-Type', /json/)
                .expect(201);
    
            const requestDate = new Date(launchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(requestDate).toBe(responseDate);
            expect(response.body).toMatchObject(launchDataNoDate);
        });
    
        test('It should catch missing required properties', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchDataNoDate)
                .expect('Content-Type', /json/)
                .expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Missing required launch property',
            });
        });
    
        test('It should catch invalid dates', async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataInvalidDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Invalid launch date',
            });
        });
    });
});