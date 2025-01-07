import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { initSocket } from './websocket/socket';

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: process.env.ALLOW_ORIGIN, credentials: true }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

initSocket();

app.get('/', (req, res) => {
  res.send('WebSocket Chat Server is running...');
});

app.post('/login', (req, res) => {
  res.json('Test');
});

export { app, prisma };
