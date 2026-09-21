import { createApp } from './app.js';
import { env } from './config/env.js';
import { startCleanupScheduler, stopCleanupScheduler } from './modules/cleanup/cleanup.scheduler.js';

const app = createApp();

if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`🚀 OptiPress Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`   Health endpoint: http://localhost:${env.PORT}/health`);

    // Start background TTL & orphan cleanup scheduler
    startCleanupScheduler();
  });

  const handleShutdown = () => {
    console.log(' Shutting down OptiPress Server...');
    stopCleanupScheduler();
    process.exit(0);
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

export default app;


