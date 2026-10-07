import { createApp } from './app';
import { env } from './config/env';
import { closePool } from './config/database';

const app = createApp();

const startServer = async () => {
  try {
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Closing HTTP server and database pool...`);
      server.close(async () => {
        await closePool();
        console.log('✅ Clean shutdown completed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
