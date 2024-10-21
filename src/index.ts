import { createServer } from './server';
import { startCluster } from './cluster';

const PORT = Number(process.env.PORT) || 4000;

const isClusterMode = () => process.argv.includes('--cluster');

if (isClusterMode()) {
	startCluster(PORT);
} else {
	createServer(PORT);
}
