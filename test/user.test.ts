import http from 'http';
import request from 'supertest';
import { createServer } from '../src/server';

const PORT = Number(process.env.PORT) || 4000;

describe('CRUD API Tests', () => {
	let server: http.Server;
	let userId: string;

	beforeAll(() => {
		server = createServer(PORT);
	});

	afterAll(() => {
		server.close();
	});

	it('should create a new user', async () => {
		const newUser = {
			username: 'TestUser',
			age: 25,
			hobbies: ['reading', 'gaming'],
		};

		const response = await request(server).post('/api/users').send(newUser).expect(201);

		expect(response.body).toHaveProperty('id');
		expect(response.body.username).toBe(newUser.username);
		expect(response.body.age).toBe(newUser.age);
		expect(response.body.hobbies).toEqual(newUser.hobbies);

		userId = response.body.id;
	});

	it('should get all users', async () => {
		const response = await request(server).get('/api/users').expect(200);

		expect(Array.isArray(response.body)).toBe(true);
	});

	it('should get a user by ID', async () => {
		const response = await request(server).get(`/api/users/${userId}`).expect(200);

		expect(response.body.id).toBe(userId);
	});

	it('should return 404 if user not found', async () => {
		const invalidUserId = 'c56a4180-65aa-42ec-a945-5fd21dec0538';

		const response = await request(server).get(`/api/users/${invalidUserId}`).expect(404);

		expect(response.text).toBe('User not found');
	});

	it('should update a user', async () => {
		const updatedUser = {
			username: 'UpdatedUser',
			age: 30,
			hobbies: ['coding', 'music'],
		};

		const response = await request(server)
			.put(`/api/users/${userId}`)
			.send(updatedUser)
			.expect(200);

		expect(response.body.username).toBe(updatedUser.username);
		expect(response.body.age).toBe(updatedUser.age);
		expect(response.body.hobbies).toEqual(updatedUser.hobbies);
	});

	it('should return 404 if trying to update a non-existing user', async () => {
		const updatedUser = {
			username: 'UpdatedUser',
			age: 30,
			hobbies: ['coding', 'music'],
		};

		const response = await request(server)
			.put(`/api/users/c56a4180-65aa-42ec-a945-5fd21dec0538`)
			.send(updatedUser)
			.expect(404);

		expect(response.text).toBe('User not found');
	});

	it('should return 400 if username is missing', async () => {
		const newUser = {
			age: 30,
			hobbies: ['reading', 'coding'],
		};

		const response = await request(server).post('/api/users').send(newUser).expect(400);

		expect(response.text).toBe('Username is required and must be a string');
	});

	it('should return 400 if age is missing', async () => {
		const newUser = {
			username: 'TestUser',
			hobbies: ['reading', 'coding'],
		};

		const response = await request(server).post('/api/users').send(newUser).expect(400);

		expect(response.text).toBe('Age is required and must be a number');
	});

	it('should return 400 if hobbies are not an array of strings', async () => {
		const newUser = {
			username: 'TestUser',
			age: 30,
			hobbies: 'not an array',
		};

		const response = await request(server).post('/api/users').send(newUser).expect(400);

		expect(response.text).toBe('Hobbies must be an array of strings');
	});

	it('should return 400 if user ID is invalid format', async () => {
		const invalidUserId = 'invalid-uuid';

		const response = await request(server).get(`/api/users/${invalidUserId}`).expect(400);

		expect(response.text).toBe('Invalid User ID format');
	});

	it('should return 400 if username is not a string during update', async () => {
		const invalidUpdate = {
			username: 12345,
		};

		const response = await request(server)
			.put(`/api/users/${userId}`)
			.send(invalidUpdate)
			.expect(400);

		expect(response.text).toBe('Username must be a string');
	});

	it('should return 400 if age is not a number during update', async () => {
		const invalidUpdate = {
			age: 'thirty',
		};

		const response = await request(server)
			.put(`/api/users/${userId}`)
			.send(invalidUpdate)
			.expect(400);

		expect(response.text).toBe('Age must be a number');
	});

	it('should return 400 if hobbies is not an array of strings during update', async () => {
		const invalidUpdate = {
			hobbies: 'not an array',
		};

		const response = await request(server)
			.put(`/api/users/${userId}`)
			.send(invalidUpdate)
			.expect(400);

		expect(response.text).toBe('Hobbies must be an array of strings');
	});
	it('should delete a user by ID', async () => {
		await request(server).delete(`/api/users/${userId}`).expect(204);
	});

	it('should return 404 if trying to delete a non-existing user', async () => {
		await request(server).delete(`/api/users/c56a4180-65aa-42ec-a945-5fd21dec0538`).expect(404);
	});
});
