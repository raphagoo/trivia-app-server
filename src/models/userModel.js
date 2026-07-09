
import mongoose from "mongoose";
import { default as autopopulate } from "mongoose-autopopulate";
let Schema = mongoose.Schema;
import bcrypt from 'bcrypt';
let SALT_WORK_FACTOR = 10;

export const UserSchema = new Schema({
    username: {
        type: String,
        required: 'Username required',
        unique: true
    },
    password: {
        type: String,
        required: 'Password required'
    }
});

// Mongoose 9 middleware is promise-based: the hook must return a promise, there is no next()
UserSchema.pre('save', function() {
    // only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return;

    return bcrypt.genSalt(SALT_WORK_FACTOR)
    .then((salt) => bcrypt.hash(this.password, salt))
    .then((hash) => {
        // override the cleartext password with the hashed one
        this.password = hash;
    });
});

UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.plugin(autopopulate);

export const User = mongoose.model('User', UserSchema);
