import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 OptiPress Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`   Health endpoint: http://localhost:${env.PORT}/health`);
});
