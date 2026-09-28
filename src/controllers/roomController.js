import { Room } from "../models/roomModel.js";
import { Question } from '../models/questionModel.js';
import { User } from '../models/userModel.js';
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

// Multiple tabs/devices for the room owner each schedule their own client-side
// timer and independently emit next_question for the same round. The update
// below is conditioned on the currentIndex/inGame values just read, so only
// the first caller for a given round actually advances the room; concurrent or
// late duplicate calls find no matching document, fall back to the
// already-advanced state, and re-report it instead of skipping ahead or
// indexing past the end of room.questions.
export const nextQuestion = (payload) => {
    return Room.findById(payload.room)
    .then(room => {
        if (!room) {
            return Promise.reject(new Error('Room not found'));
        }
        if (!room.inGame) {
            return room;
        }

        const nextIndex = room.currentIndex + 1;
        const update = nextIndex >= room.questions.length
            ? { inGame: false }
            : { currentIndex: nextIndex, currentQuestion: room.questions[nextIndex].question };

        return Room.findOneAndUpdate(
            { _id: room._id, currentIndex: room.currentIndex, inGame: true },
            update,
            { returnDocument: 'after' }
        )
        .then((updatedRoom) => updatedRoom || Room.findById(room._id))
        .then((currentRoom) => {
            if (!currentRoom.inGame) {
                return currentRoom;
            }
            return Question.findById(currentRoom.currentQuestion)
            .then((question) => ({room: currentRoom, question}));
        });
    })
}


export const endGame = (payload) => {
    return Room.findOneAndUpdate({"_id": payload.room}, { inGame: false, difficulties: '', time: '', tags: '', currentIndex: 0, currentQuestion: null, questions: [] }, { returnDocument: 'after' })
    .then((room) => {
        if (room && room.users.length > 0) {
            const userIds = room.users.map((user) => user._id);
            return User.updateMany({"_id": {$in: userIds}}, {$inc: {'stats.gamesPlayed': 1}})
            .then(() => room);
        }
        return room;
    });
};
