import mongoose from 'mongoose';
import request from 'supertest';
import server from '../index.js';
import { UserSchema } from '../src/models/userModel';
const User = mongoose.model('User', UserSchema);
import dotenv from 'dotenv';
dotenv.config();
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_TEST_URL);

afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
});

test('There is a User', async () => {
    const user = await User.findOne({ username: 'user 1' });
    expect(user).toBeTruthy();
});

test('Login with correct credentials', async () => {
    const response = await request(server)
      .post('/user/login') // replace with your login route
      .send({
        username: 'user 1',
        password: 'password' // replace with the correct password
      });
  
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
