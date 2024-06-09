import mongoose from 'mongoose';
import { UserSchema } from '../src/models/userModel';
const User = mongoose.model('User', UserSchema);
import dotenv from 'dotenv';
dotenv.config();
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_TEST_URL);

afterAll(async () => {
    await mongoose.connection.close();
});

test('There is a User', async () => {
    const user = await User.findOne({ username: 'user 1' });
    expect(user).toBeTruthy();
});
