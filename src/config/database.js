import mongoose from 'mongoose';

export const connectDatabase = () => {
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

    return mongoose.connect(dbUrl);
};
