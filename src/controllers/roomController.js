import { Room } from "../models/roomModel.js";
import { Question } from '../models/questionModel.js';
import { verifyJwt } from '../services/jwtVerification.js';


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
        Room.findOneAndUpdate({"_id": req.params.id}, {$push: {users: token.data}}, {returnDocument: 'after'})
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

// Resolves with the updated room, or null when the room was empty and got deleted (or didn't exist)
export const removeUserFromRoom = (payload) => {
    return Room.findOneAndUpdate({"_id": payload.room}, {$pull : {'users': payload.user._id}}, {returnDocument: 'after'})
    .then((room) => {
        if(!room) {
            return null;
        }
        if(room.users.length === 0) {
            return Room.findOneAndDelete({"_id": payload.room}).then(() => null);
        }
        return room;
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
    Room.findOneAndUpdate({"_id": req.params.id}, req.body, {returnDocument: 'after'})
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
    return Room.findOneAndUpdate({"_id": payload.room}, { inGame: true }, { returnDocument: 'after' });
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
    return Room.findById(payload.room)
    .then(room => {
        if (!room) {
            return Promise.reject(new Error('Room not found'));
        }

        room.currentIndex = room.currentIndex + 1;
        if(room.currentIndex === room.questions.length) {
            room.inGame = false;
            return room;
        }
        room.currentQuestion = room.questions[room.currentIndex].question;
        return room.save()
        .then((room) => {
            return Question.findById(room.currentQuestion)
            .then((question) => ({room, question}));
        });
    })
}


export const endGame = (payload) => {
    return Room.findOneAndUpdate({"_id": payload.room}, { inGame: false, difficulties: '', time: '', tags: '', currentIndex: 0, currentQuestion: null, questions: [] }, { returnDocument: 'after' });
};
