import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';


import morgan from 'morgan';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFound';
import { stripeWebhookHandler } from './app/webhook/webhook.stripe';



const app: Application = express();

app.post(
  '/api/v1/bookings/webhook',
  express.raw({ type: 'application/json' }), 
  stripeWebhookHandler
);


// Now apply JSON parser for all other routes
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(
  cors({
    origin: [
      'http://10.10.20.13:5000',
      'http://10.10.20.34:3000',
      'http://localhost:5175',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://portfolio-frontend-lemon-alpha.vercel.app'
 
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
);



app.use(morgan('dev'));
app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
  res.send('Server is Running...');
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;