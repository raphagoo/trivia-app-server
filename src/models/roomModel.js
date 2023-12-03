import mongoose from 'mongoose';
import { default as autopopulate } from "mongoose-autopopulate";

const ObjectId = mongoose.Schema.Types.ObjectId;

const Schema = mongoose.Schema;

export const RoomSchema = new Schema({
    name: {
        type: String,
        required: 'name required'
    },
    inGame: {
        type: Boolean,
        required: 'inGame required'
    },
    users:[{
        type: ObjectId,
        ref: 'User',
        autopopulate: true
    }],
    owner: {
        type: ObjectId,
        ref: 'User',
    }
});
RoomSchema.plugin(autopopulate);
