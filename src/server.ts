import { createServer, Server } from 'http';
import app from './app';
import mongoose from 'mongoose';
import config from './app/config';
import cron from 'node-cron';
import { DestinationControllers } from './app/modules/Destination/destination.controller';


let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log('✅ Connected to MongoDB');

    server = createServer(app);

    // auto sync every Sunday at midnight
    cron.schedule('0 0 * * 0', async () => {
      try {
        console.log('⏳ Running automated global city sync...');
        await DestinationControllers.syncEverythingDynamically();
        console.log('✅ Global city sync completed successfully.');
      } catch (error) {
        console.error('❌ Cron Job Error:', error);
      }
    });

 
    const cityCount = await mongoose.connection.db!.collection('destinations').countDocuments();
    if (cityCount === 0) {
      console.log('ℹ️ DB is empty. Running initial sync...');

      DestinationControllers.syncEverythingDynamically(); 
    }

    server.listen(Number(config.port), "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
}

main();

process.on('unhandledRejection', (err) => {
  console.log(`😈 unhandledRejection is detected, shutting down...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.log(`😈 uncaughtException is detected, shutting down...`, err);
  process.exit(1);
});