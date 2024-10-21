import http from 'http';
import { userRoutes } from './routes/userRoutes';

export const createServer = (port: number) => {
	const server = http.createServer((req, res) => {
		userRoutes(req, res);
	});

	server.listen(port, () => {
		console.log(`Server is running on http://localhost:${port}`);
	});

	return server;
};
