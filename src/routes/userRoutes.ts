import { IncomingMessage, ServerResponse } from 'http';
import {
	createUser,
	deleteUser,
	getUserById,
	getUsers,
	updateUser,
} from '../controllers/userController';
import { extractParamsFromUrl } from '../utils/params';

const isClusterMode = () => process.argv.includes('--cluster');

type RouteHandler = (
	req: IncomingMessage,
	res: ServerResponse,
	params: Record<string, string>
) => void;

const routes: { method: string; path: string; handler: RouteHandler }[] = [
	{ method: 'GET', path: '/api/users', handler: getUsers },
	{ method: 'GET', path: '/api/users/:userId', handler: getUserById },
	{ method: 'POST', path: '/api/users', handler: createUser },
	{ method: 'PUT', path: '/api/users/:userId', handler: updateUser },
	{ method: 'DELETE', path: '/api/users/:userId', handler: deleteUser },
];

const matchRoute = (
	method: string,
	url: string
): { handler: RouteHandler; params: Record<string, string> } | null => {
	for (const route of routes) {
		if (route.method !== method) continue;

		const routeParts = route.path.split('/').filter(Boolean);
		const urlParts = url.split('/').filter(Boolean);
		if (routeParts.length !== urlParts.length) continue;
		let isMatch = true;

		for (let i = 0; i < routeParts.length; i++) {
			if (!routeParts[i].startsWith(':') && routeParts[i] !== urlParts[i]) {
				isMatch = false;
				break;
			}
		}
		if (isMatch) {
			const params = extractParamsFromUrl(route.path, url);
			return { handler: route.handler, params };
		}
	}
	return null;
};

export const userRoutes = (req: IncomingMessage, res: ServerResponse) => {
	const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
	const method = req.method || '';

	const routeMatch = matchRoute(method, pathname);

	if (routeMatch) {
		const { handler, params } = routeMatch;
		if (isClusterMode()) {
			console.log(
				`---Worker ${process.pid} received request on port: ${process.env.PORT}, URL: ${pathname}\n`
			);
		}
		try {
			handler(req, res, params);
		} catch (error) {
			console.error('Error handling request:', error);
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('Internal Server Error');
		}
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('Not Found');
	}
};
