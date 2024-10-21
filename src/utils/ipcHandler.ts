import { User } from '../models/users';

export const sendToMaster = async (action: string, payload: any) => {
	if (process.send) {
		process.send({ action, payload });
	}
};

export const requestSyncUsers = async () => {
	await sendToMaster('syncUsers', null);
};

export const addUserToMaster = async (newUser: User) => {
	await sendToMaster('addUser', newUser);
};

export const updateUserInMaster = async (updatedUser: User) => {
	await sendToMaster('updateUser', updatedUser);
};

export const deleteUserFromMaster = async (userId: string) => {
	await sendToMaster('deleteUser', userId);
};