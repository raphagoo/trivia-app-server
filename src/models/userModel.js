
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

UserSchema.pre('save', function(next) {
    let user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.plugin(autopopulate);
