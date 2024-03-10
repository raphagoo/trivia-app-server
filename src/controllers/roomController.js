import mongoose from 'mongoose';
import { RoomSchema } from "../models/roomModel.js";
import { verifyJwt } from '../services/jwtVerification.js';
import { QuestionSchema } from '../models/questionModel.js';
const Room = mongoose.model('Room', RoomSchema);
const Question = mongoose.model('Question', QuestionSchema);


export const createRoom = (req, res) => {
    let token = verifyJwt(req)
    let toCreate = {name: req.body.name, owner: token.data, inGame: false};
    if(token){
        let newRoom = new Room(toCreate);
        newRoom.save()
        .then((room) => {
            res.status(201).json(room);
        }).catch((err) => {
            res.status(400).send(err);
        })
    }
    else{
        res.sendStatus(401);
    }
};

export const joinRoom = (req, res) => {
    let token = verifyJwt(req)
    if(token) {
        Room.findOneAndUpdate({"_id": req.params.id}, {$push: {users: token.data}}, {new: true, useFindAndModify: false})
        .then((room) => {
            if(!room) {
                res.sendStatus(404);
            } else {
                res.status(200).json(room);
            }
        }).catch((err) => {
            res.status(400).send(err);
        });
    }
    else{
        res.sendStatus(401);
    }
};

export const removeUserFromRoom = (payload) => {
    Room.findOneAndUpdate({"_id": payload.room}, {$pull : {'users': payload.user._id}}, {new: true, useFindAndModify: false})
    .then((room) => {
        console.log('rooms users', room)
        if(room.users.length === 0) {
            Room.findOneAndDelete({"_id": payload.room})
            .then((room) => {
                if(room) {
                    console.log('deleted')
                }
            })
        }
    }).catch((err) => {
        console.log(err)
    });
}

export const listRooms = (req, res) => {
    Room.find({})
    .then((rooms) => {
        res.status(200).json(rooms)
    }).catch((err) => {
        res.status(400).send(err);
    });
};

export const getRoom = (req, res) => {
    Room.findById(req.params.id)
    .then((room) => {
        if(room) {
            res.status(200).json(room)
        } else if(room == null) {
            res.sendStatus(404)
        }
    }).catch((err) => {
        res.status(400).send(err);
    });
};

export const updateRoom = (req, res) => {
    Room.findOneAndUpdate({"_id": req.params.id}, req.body, {new: true, useFindAndModify: false})
    .then((room) => {
        if(room) {
            res.status(200).json(room);
        } else if(room == null) {
            res.sendStatus(404);
        }
    }).catch((err) => {
        res.status(400).send(err);
    });
};

export const deleteRoom = (req, res) => {
    Room.findOneAndDelete({"_id": req.params.id})
    .then((room) => {
        if(room) {
            res.sendStatus(204);
        } else if (room == null) {
            res.sendStatus(404);
        }
    }).catch((err) => {
        res.status(400).send(err);
    });
};

export const startGame = (payload) => {
    return new Promise((resolve, reject) => {
        Room.findOneAndUpdate({"_id": payload.room}, { inGame: true }, { new: true, useFindAndModify: false })
        .then((room) => {
            resolve(room)
        }).catch((err) => {
            reject(err)
        })
    })
};

export const getQuestion = (req, res) => {
    Room.findById(req.params.id)
    .then((room) => {
        if(room) {
            Question.findById(room.currentQuestion)
            .then((question) => {
                res.status(200).json(question)
            }).catch((err) => {
                res.status(400).send(err);
            });
        } else if(room === null) {
            res.sendStatus(404)
        }
    }).catch((err) => {
        res.status(400).send(err);
    });
}

export const nextQuestion = (payload) => {
    return new Promise((resolve, reject) => {
        Room.findById(payload.room)
        .then(room => {
            if (!room) {
                reject('Room not found');
            }

            room.currentIndex = room.currentIndex + 1;
            if(room.currentIndex === room.questions.length - 1) {
                room.inGame = false;
            }
            room.currentQuestion = room.questions[room.currentIndex].question;
            room.save()
            .then((room) => {
                resolve(room);
            }).catch((err) => {
                reject(err);
            });
        })
    })
}

export const endGame = (payload) => {
    return new Promise((resolve, reject) => {
        Room.findOneAndUpdate({"_id": payload.room}, { inGame: false, difficulties: '', time: '', tags: '' }, { new: true, useFindAndModify: false })
        .then((room) => {
            resolve(room)
        }).catch((err) => {
            reject(err)
        })
    })
};
