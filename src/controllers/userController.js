import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { UserSchema } from "../models/userModel.js";
import bcrypt from 'bcrypt';

const User = mongoose.model('User', UserSchema);

export const createUser = (req, res) => {
    let newUser = new User(req.body);
    newUser.save((err, user) => {
        if(err) {
            res.status(400).send(err);
        } else {
            //let token = jwt.sign({exp: Math.floor(Date.now() / 1000) + (60 * 60), data: user}, 'mySuperSecrett');
            //let response = {user: user,token: token}
            res.status(201).json(user);
        }
    })
};

export const listUsers = (req, res) => {
    User.find({})
    .exec((err, users) => {
        if(err) {
            res.status(400).send(err);
        } else {
            res.status(200).json(users)
        }
    });
};

export const getUser = (req, res) => {
    User.findById(req.params.id)
    .exec((err, user) => {
        if(err) {
            res.status(400).send(err);
        } else if(user === null) {
            res.sendStatus(404)
        } else {
            res.status(200).json(user)
        }
    });
};

export const login = (req, res) => {
    User.findOne({username: req.body.username})
    .exec((err, user) => {
        if (user === null) {
            res.sendStatus(404)
        }
        else{
            bcrypt.compare(req.body.password, user.password, function(err, response) {
                if(response) {
                    let token = jwt.sign({exp: Math.floor(Date.now() / 1000) + (60 * 60), data: {username: user.username}}, 'mySuperSecrett');
                    const response = {user: user, token: token}
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
    .exec((err, user) => {
        if(err) {
            res.status(400).send(err);
        } else {
            if(user == null) {
                res.sendStatus(404);
            }
            else {
                res.status(200).json(user);
            }
        }
    });
};

export const deleteUser = (req, res) => {
    User.findOneAndDelete({"_id": req.params.id}, (err, user) => {
        if(err) {
            res.status(400).send(err);
        } else {
            if(user == null) {
                res.sendStatus(404);
            }
            else {
                res.sendStatus(204);
            }
        }
    });
};
