import mongoose from 'mongoose';
import fixtures from './fixtures.js';
import { UserSchema } from '../src/models/userModel.js';
const User = mongoose.model('User', UserSchema);
import dotenv from 'dotenv';
dotenv.config();

// Connect to the test database
mongoose.connect(process.env.MONGO_TEST_URL);

// Drop existing data
await mongoose.connection.dropDatabase();

// Load fixtures
await Promise.all(fixtures.users.map(async (fixture) => {
    let user = new User(fixture);
    await user.save();
}));

console.log('Fixtures loaded successfully!');

process.exit(0);
