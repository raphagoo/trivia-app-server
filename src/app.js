import express from 'express';

import { userRoutes } from "./routes/userRoutes.js";
import { roomRoutes } from "./routes/roomRoutes.js";
import { triviaRoutes } from './routes/triviaRoutes.js';

export const createApp = () => {
    const app = express();

    app.use(express.urlencoded({extended: true}));
    app.use(express.json());
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept, Authorization");
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
        next();
    });

    userRoutes(app);
    roomRoutes(app);
    triviaRoutes(app);
    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    return app;
};
