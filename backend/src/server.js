import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB');

  const app = createApp({ corsOrigins: env.corsOrigins });
  const server = app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
