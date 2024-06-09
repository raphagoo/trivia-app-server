import mongoose from 'mongoose';
import fixtures from './fixtures.js';
import { UserSchema } from '../src/models/userModel.js';
import { RoomSchema } from '../src/models/roomModel.js';
const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);
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

await Promise.all(fixtures.rooms.map(async (fixture) => {
    let room = new Room(fixture);
    room.owner = await User.findOne({username: 'user 2'});
    room.users.push(await User.findOne({username: 'user 2'}))
    await room.save();
}));

console.log('Fixtures loaded successfully!');

process.exit(0);
