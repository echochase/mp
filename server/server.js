const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./socket');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "https://github.com",
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

socketHandler(io);

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
