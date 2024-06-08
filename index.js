import express from 'express';
let app = express();
import http from 'http';
let server = http.createServer(app);
import { Server } from "socket.io";
import dotenv from 'dotenv';
dotenv.config();


const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

import mongoose from 'mongoose';


import { userRoutes } from "./src/routes/userRoutes.js";
import { roomRoutes } from "./src/routes/roomRoutes.js";
import { triviaRoutes } from './src/routes/triviaRoutes.js';
import { endGame, removeUserFromRoom, startGame, nextQuestion } from './src/controllers/roomController.js';
import { checkAnswer } from './src/controllers/answerController.js';
import { getQuestions } from './src/controllers/triviaController.js';
import { UserSchema } from './src/models/userModel.js';
const User = mongoose.model('User', UserSchema);



app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    next();
});

// mongoose connection
mongoose.Promise = global.Promise;
let dbUrl;
switch (process.env.NODE_ENV) {
    case 'production':
        dbUrl = process.env.MONGODB_URL;
        break;
    case 'test':
        dbUrl = process.env.MONGO_TEST_URL;
        break;
    case 'development':
        dbUrl = 'mongodb://localhost/trivia-app';
        break;
    default:
        console.error('Invalid NODE_ENV value');
        process.exit(1);
}

mongoose.connect(dbUrl);

async function logUsers() {
    try {
        const users = await User.find();
        console.log(users);
    } catch (error) {
        console.error('Error retrieving users:', error);
    }
}

await logUsers();

// Routes initialisation
userRoutes(app);
roomRoutes(app);
triviaRoutes(app);

// Define a connection event for Socket.io
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle custom events
    socket.on('create_room', (message) => {
        io.emit('create_room', message); // Broadcast the message to all connected clients
    });

    socket.on('join_room', (payload) => {
        io.emit('join_room', payload); // Broadcast the message to all connected clients
    });

    socket.on('leave_room', payload => {
        removeUserFromRoom(payload);
        io.emit('leave_room', payload); // Broadcast the message to all connected clients
    });

    socket.on('generate_quizz', payload => {
        getQuestions(payload).then((room) => {
            io.emit('generate_quizz', {room});
        })
    });

    socket.on('next_question', payload => {
        nextQuestion(payload).then((response) => {
            io.emit('next_question', response);
        })
    })

    socket.on('start_game', payload => {
        startGame(payload).then((room) => {
            io.emit('started_game', room);
        })
    });

    socket.on('check_answer', payload => {
        checkAnswer(payload).then((answer) => {
            io.emit('checked_answer', {correct: answer.correct, answerCorrectId: answer.answerCorrectId, userId: payload.user._id});
        })
    });

    socket.on('end_game', payload => {
        endGame(payload).then((room) => {
            io.emit('end_game', room)
        })
    })



    // Handle disconnection event
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


server.listen(process.env.PORT || 3000,
    console.log('Server running on port' + process.env.PORT || 3000),
);

