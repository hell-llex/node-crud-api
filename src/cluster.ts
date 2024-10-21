import cluster, { Worker } from 'cluster';
import http from 'http';
import os from 'os';
import { createServer } from './server';
import { syncUsers } from './controllers/userController';
import { getUsersStore, addUserStore, updateUserStore, deleteUserStore } from './models/userStore';

const workerPorts: number[] = [];
let currentWorker = 0;

const syncUsersToWorkers = async () => {
	for (const id in cluster.workers) {
		if (cluster.workers[id]) {
			cluster.workers[id]?.send({ action: 'syncUsers', payload: await getUsersStore() });
		}
	}
};

const handleWorkerMessage = async (worker: Worker, message: any) => {
	const { action, payload } = message;

	switch (action) {
		case 'addUser':
			await addUserStore(payload);
			syncUsersToWorkers();
			break;
		case 'updateUser':
			await updateUserStore(payload);
			syncUsersToWorkers();
			break;
		case 'deleteUser':
			await deleteUserStore(payload);
			syncUsersToWorkers();
			break;
		case 'syncUsers':
			worker.send({ action: 'syncUsers', payload: await getUsersStore() });
			break;
		default:
			break;
	}
};

const createLoadBalancer = (port: number) => {
	const server = http.createServer((req, res) => {
		const targetPort = workerPorts[currentWorker];
		console.log(`\n---Redirecting request to worker on port: ${targetPort}`);

		currentWorker = (currentWorker + 1) % workerPorts.length;
		const options = {
			hostname: 'localhost',
			port: targetPort,
			path: req.url,
			method: req.method,
			headers: req.headers,
		};

		const proxy = http.request(options, (proxyRes) => {
			res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
			proxyRes.pipe(res, { end: true });
		});

		proxy.on('error', (error) => {
			console.error('Proxy error:', error);
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('Internal Server Error');
		});

		req.pipe(proxy, { end: true });
	});

	server.listen(port, () => {
		console.log(`Load balancer is running on http://localhost:${port}\n`);
	});
};

export const startCluster = (port: number) => {
	if (cluster.isPrimary) {
		const numCPUs = os.cpus().length;

		for (let i = 1; i < numCPUs; i++) {
			workerPorts.push(port + i);
		}

		console.log(`\nPrimary ${process.pid} is running. Spawning ${numCPUs} workers...\n`);

		createLoadBalancer(port);

		for (let i = 1; i < numCPUs; i++) {
			const workerPort = port + i;
			const worker = cluster.fork({ PORT: workerPort });

			worker.on('message', (message) => handleWorkerMessage(worker, message));
		}

		cluster.on('exit', (worker, _code, _signal) => {
			console.error(`Worker ${worker.process.pid} died. Spawning a new worker...`);
			const newWorkerPort = workerPorts[currentWorker];
			const newWorker = cluster.fork({ PORT: newWorkerPort });
			newWorker.on('message', (message) => handleWorkerMessage(newWorker, message));
		});
	} else {
		const workerPort = Number(process.env.PORT);
		try {
			createServer(workerPort);

			process.on('message', (message: any) => {
				const { action, payload } = message;
				if (action === 'syncUsers') {
					syncUsers(payload);
				}
			});

			console.log(`- Worker ${process.pid} started and listening on port ${workerPort}`);
		} catch (error) {
			console.error('Error starting worker server:', error);
		}
	}
};
