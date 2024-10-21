import { IncomingMessage, ServerResponse } from 'http';
import { User } from '../models/users';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import { addUserToMaster, updateUserInMaster, deleteUserFromMaster } from '../utils/ipcHandler';
import {
	addUserStore,
	deleteUserStore,
	getUsersStore,
	updateUsersStore,
	updateUserStore,
} from '../models/userStore';

const isClusterMode = () => process.argv.includes('--cluster');

export const syncUsers = async (updatedUsers: User[]) => {
	await updateUsersStore(updatedUsers);
};

export const getUsers = async (
	_req: IncomingMessage,
	res: ServerResponse,
	_params: Record<string, string> = {}
) => {
	try {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(await getUsersStore()));
	} catch (error) {
		console.error('Error getting users:', error);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('Internal Server Error');
	}
};

export const getUserById = async (
	_req: IncomingMessage,
	res: ServerResponse,
	params: Record<string, string> = {}
) => {
	const { userId } = params;

	if (!userId) {
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		return res.end('User ID is required');
	}

	if (!validateUuid(userId)) {
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		return res.end('Invalid User ID format');
	}

	try {
		const user = (await getUsersStore()).find((u) => u.id === userId) || null;
		if (!user) {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			return res.end('User not found');
		}

		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(user));
	} catch (error) {
		console.error('Error getting user by ID:', error);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('Internal Server Error');
	}
};

export const createUser = async (
	_req: IncomingMessage,
	res: ServerResponse,
	_params: Record<string, string>
) => {
	let body: string = '';

	_req.on('data', (chunk) => {
		body += chunk.toString();
	});

	_req.on('end', async () => {
		try {
			const newUser: User = JSON.parse(body);

			if (!newUser.username || typeof newUser.username !== 'string') {
				res.writeHead(400, { 'Content-Type': 'text/plain' });
				return res.end('Username is required and must be a string');
			}

			if (newUser.age === undefined || typeof newUser.age !== 'number') {
				res.writeHead(400, { 'Content-Type': 'text/plain' });
				return res.end('Age is required and must be a number');
			}

			if (
				!Array.isArray(newUser.hobbies) ||
				!newUser.hobbies.every((hobby) => typeof hobby === 'string')
			) {
				res.writeHead(400, { 'Content-Type': 'text/plain' });
				return res.end('Hobbies must be an array of strings');
			}

			newUser.id = uuidv4();
			if (isClusterMode()) {
				await addUserToMaster(newUser);
			} else {
				await addUserStore(newUser);
			}

			res.writeHead(201, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(newUser));
		} catch (error) {
			console.error('Error creating user:', error);
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('Internal Server Error');
		}
	});
};

export const updateUser = async (
	_req: IncomingMessage,
	res: ServerResponse,
	params: Record<string, string>
) => {
	const { userId } = params;

	if (!userId || !validateUuid(userId)) {
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		return res.end('Invalid User ID format');
	}

	try {
		const userIndex = (await getUsersStore()).findIndex((u) => u.id === userId);
		if (userIndex === -1) {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			return res.end('User not found');
		}

		let body: string = '';

		_req.on('data', (chunk) => {
			body += chunk.toString();
		});

		_req.on('end', async () => {
			try {
				const updatedUserData: Partial<User> = JSON.parse(body);
				const existingUser = (await getUsersStore())[userIndex];

				if (updatedUserData.username && typeof updatedUserData.username !== 'string') {
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					return res.end('Username must be a string');
				}

				if (updatedUserData.age !== undefined && typeof updatedUserData.age !== 'number') {
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					return res.end('Age must be a number');
				}

				if (
					!Array.isArray(updatedUserData.hobbies) ||
					!updatedUserData.hobbies.every((hobby) => typeof hobby === 'string')
				) {
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					return res.end('Hobbies must be an array of strings');
				}

				const updatedUser: User = { ...existingUser, ...updatedUserData };
				if (isClusterMode()) {
					await updateUserInMaster(updatedUser);
				} else {
					await updateUserStore(updatedUser);
				}

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(updatedUser));
			} catch (error) {
				console.error('Error updating user:', error);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('Internal Server Error');
			}
		});
	} catch (error) {
		console.error('Error finding user for update:', error);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('Internal Server Error');
	}
};

export const deleteUser = async (
	_req: IncomingMessage,
	res: ServerResponse,
	params: Record<string, string>
) => {
	const { userId } = params;

	if (!userId || !validateUuid(userId)) {
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		return res.end('Invalid User ID format');
	}

	try {
		const userIndex = (await getUsersStore()).findIndex((u) => u.id === userId);
		if (userIndex === -1) {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			return res.end('User not found');
		}

		if (isClusterMode()) {
			await deleteUserFromMaster(userId);
		} else {
			await deleteUserStore(userId);
		}

		res.writeHead(204);
		res.end();
	} catch (error) {
		console.error('Error deleting user:', error);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('Internal Server Error');
	}
};
