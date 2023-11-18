import express from 'express';
let app = express();
import http from 'http';
let server = http.createServer(app);
import { Server } from "socket.io";
import { createRoom, listRooms } from "./src/controllers/roomController.js";


const io = new Server(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

import mongoose from 'mongoose';


import { userRoutes } from "./src/routes/userRoutes.js";
import { roomRoutes } from "./src/routes/roomRoutes.js";


app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    next();
});


export const autoIncrement = import('mongoose-auto-increment');

// mongoose connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/trivia-app');

// Routes initialisation
userRoutes(app);
roomRoutes(app);

// Define a connection event for Socket.io
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle custom events
    socket.on('create_room', (message) => {
        console.log('Created room:', message);
        io.emit('create_room', message); // Broadcast the message to all connected clients
    });

    // Handle disconnection event
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


server.listen(process.env.PORT || 3000,
    console.log(`listening`)
);

