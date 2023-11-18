import mongoose from 'mongoose';
import { RoomSchema } from "../models/roomModel.js";
import { verifyJwt } from '../services/jwtVerification.js';
const Room = mongoose.model('Room', RoomSchema);

export const createRoom = (req, res) => {
    //if(verifyJwt(req) === true){
        let newRoom = new Room(req.body);
        newRoom.save((err, room) => {
            if(err) {
                res.status(400).send(err);
            } else {
                res.status(201).json(room);
            }
        })
    //}
    //else{
        //res.sendStatus(403);
    //}
};

export const listRooms = (req, res) => {
    Room.find({})
    .then((rooms, err) => {
        if(rooms) {
            res.status(200).json(rooms)
        } else {
            res.status(400).send(err);
        }
    });
};

export const getRoom = (req, res) => {
    Room.findById(req.params.id)
    .then((room, err) => {
        if(room) {
            res.status(200).json(room)
        } else if(room == null) {
            res.sendStatus(404)
        } else {
            res.status(400).send(err);
        }
    });
};

export const updateRoom = (req, res) => {
    Room.findOneAndUpdate({"_id": req.params.id}, req.body, {new: true, useFindAndModify: false})
    .then((room, err) => {
        if(err) {
            res.status(200).json(room);
        } else {
            if(room == null) {
                res.sendStatus(404);
            }
            else {
                res.status(400).send(err);
            }
        }
    });
};

export const deleteRoom = (req, res) => {
    Room.findOneAndDelete({"_id": req.params.id}, (err, room) => {
        if(err) {
            res.status(400).send(err);
        } else {
            if(room == null) {
                res.sendStatus(404);
            }
            else {
                res.sendStatus(204);
            }
        }
    });
};
