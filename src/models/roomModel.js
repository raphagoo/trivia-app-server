import mongoose from 'mongoose';
import { default as autopopulate } from "mongoose-autopopulate";

const Schema = mongoose.Schema;

export const RoomSchema = new Schema({
    name: {
        type: String,
        required: 'name required'
    }
});
RoomSchema.plugin(autopopulate);
