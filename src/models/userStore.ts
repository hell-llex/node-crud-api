import { User } from './users';

let users: User[] = [];

export const getUsersStore = async () => users;

export const addUserStore = async (user: User) => {
	users.push(user);
};

export const updateUsersStore = async (newUsers: User[]) => {
	users = newUsers;
};

export const updateUserStore = async (updatedUser: User) => {
	const index = users.findIndex((u) => u.id === updatedUser.id);
	if (index !== -1) {
		users[index] = updatedUser;
	}
};

export const deleteUserStore = async (userId: string) => {
	users = users.filter((u) => u.id !== userId);
};
