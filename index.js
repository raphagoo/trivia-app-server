import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import http from 'http';
import { Server } from "socket.io";

import { connectDatabase } from './src/config/database.js';
import { createApp } from './src/app.js';
import { registerSocketHandlers } from './src/sockets/index.js';

connectDatabase();

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});
registerSocketHandlers(io);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
