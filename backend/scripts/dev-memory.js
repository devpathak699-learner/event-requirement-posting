// Runs the API against a throwaway in-memory MongoDB, so the project can be
// tried without installing MongoDB or creating an Atlas cluster.
// Data is lost when the process exits. Usage: npm run dev:memory
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';

const port = Number(process.env.PORT) || 5000;

const mongod = await MongoMemoryServer.create();
await mongoose.connect(mongod.getUri('event-requirements'));
console.log('Connected to in-memory MongoDB');

const server = createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));

const shutdown = async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
