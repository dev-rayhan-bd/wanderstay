
import { createServer, Server } from 'http';

import app from './app';

import mongoose from 'mongoose';
import config from './app/config';







let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);


    server = createServer(app);





  server.listen(Number(config.port), "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${config.port}`);
});


  } catch (err) {
    console.log(err);
  }
}
main();

process.on('unhandledRejection', (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
