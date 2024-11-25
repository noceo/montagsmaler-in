import 'dotenv/config';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { User } from '../types/user.types';
import { Point } from '../types/geometry.types';
import {
  DrawPathMessage,
  DrawShapeMessage,
  Message,
  ShapeData,
} from '../types/message.types';
import { PrismaClient } from '@prisma/client';
import sessions from './routes/sessions';
import { initSocket } from './sockets/socket';

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: process.env.ALLOW_ORIGIN, credentials: true }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// app.use('/api/v1/sessions', sessions);

initSocket();

app.get('/', (req, res) => {
  res.send('WebSocket Chat Server is running...');
});

app.post('/login', (req, res) => {
  res.json('Test');
});

export { app, prisma };
