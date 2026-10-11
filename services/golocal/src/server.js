import { getConfig } from './config.js';
import { Store } from './store.js';
import { Demo } from './demo.js';
import { Jobber } from './jobber.js';
import { Housecall } from './housecall.js';
import { HousecallTest } from './housecall-test.js';
import { createApp } from './app.js';
import { bootstrapHostedState } from './hosted-state.js';

const config = getConfig();
await bootstrapHostedState(config);
const store = await new Store(config.dataDir, config.encryptionKey).init();
const context = { config, store, demo: new Demo(store), jobber: new Jobber(store, config.jobber), housecall: new Housecall(config.housecall) };
context.housecallTest = new HousecallTest(context.housecall,store,config.housecall);
const server = createApp(context).listen(config.port, config.host, () => {
  console.log(`GoLocal ${config.backend} pilot: ${config.baseUrl}/operator · MCP: ${config.baseUrl}/mcp`);
});
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  server.closeIdleConnections();
  await new Promise(resolve => server.close(resolve));
  await store.close(); process.exit(0);
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
server.on('error', async () => { console.error('Unable to listen on configured port.'); await store.close(); process.exit(1); });
