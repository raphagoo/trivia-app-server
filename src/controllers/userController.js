import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { UserSchema } from "../models/userModel.js";
import bcrypt from 'bcrypt';

const User = mongoose.model('User', UserSchema);

function generateRefreshToken(user) {
    return jwt.sign({data: user}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1y' });
}

function generateAccessToken(user) {
    return jwt.sign({data: user}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
}

export const createUser = (req, res) => {
    let newUser = new User(req.body);
    newUser.save().then((user) => {
        let token = generateAccessToken(user);
        let refreshToken = generateRefreshToken(user);
        let response = {user: user, token: token, refresh: refreshToken}
        res.status(201).json(response);
    }).catch((err) => {
        res.status(400).send(err);
    })
};
export const refreshToken = (req, res) => {
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    
    if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    }

    if (token === null) return res.sendStatus(401)

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(401)
        }
        const refreshedToken = generateAccessToken(user);
        res.send({
            token: refreshedToken
        });
    });
}

export const createGuestUser = (req, res) => {
    let newUser = new User();
    newUser.username = 'guest-' + Math.random().toString(16).slice(2);
    newUser.password = 'password';
    console.log(newUser)
    newUser.save().then((user) => {
        let token = generateAccessToken(user);
        let response = {user: user, token: token}
        res.status(201).json(response);
    }).catch((err) => {
        res.status(400).send(err);
    })
};

export const listUsers = (req, res) => {
    User.find({})
    .then((users) => {
        res.status(200).json(users)
    }).catch((err) => {
        res.status(400).send(err);
    });
};

export const getUser = (req, res) => {
    User.findById(req.params.id)
    .then((user) => {
        if(user) {
            res.status(200).json(user)
        } else if(user === null) {
            res.sendStatus(404)
        }
    }).catch((err) => {
        res.status(400).send(err);
    });
};

export const login = (req, res) => {
    User.findOne({username: req.body.username})
    .then((user) => {
        if (user === null) {
            res.sendStatus(404)
        }
        else {
            bcrypt.compare(req.body.password, user.password, function(err, response) {
                if(response) {
                    let token = generateAccessToken(user);
                    let refreshToken = generateRefreshToken(user);
                    const response = {user: user, token: token, refresh: refreshToken}
                    res.status(200).json(response)
                } else {
                    res.sendStatus(404)
                } 
            });
        }
    });
};

export const updateUser = (req, res) => {
    User.findOneAndUpdate({"_id": req.params.id}, req.body, {new: true, useFindAndModify: false})
    .then((user) => {
        if(user) {
            res.status(200).json(user);
        } else if(user == null) {
            res.sendStatus(404);
        }
    }).catch((err) => {
        res.status(400).send(err);
    });
};

export const deleteUser = (req, res) => {
    User.findOneAndDelete({"_id": req.params.id})
    .then((user) => {
        if(user == null) {
            res.sendStatus(404);
        }
        else {
            res.sendStatus(204);
        }
    }).catch((err) => {
        res.status(400).send(err);
    });
};
