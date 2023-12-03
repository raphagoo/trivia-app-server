import mongoose from 'mongoose';
import { default as autopopulate } from "mongoose-autopopulate";

const ObjectId = mongoose.Schema.Types.ObjectId;

const Schema = mongoose.Schema;

export const AnswerSchema = new Schema({
    answer: {
        type: String,
        required: 'question required'
    },
    correct: {
        type: Boolean,
        required: 'correct required'
    },
    question:{
        type: ObjectId,
        ref: 'Question',
        autopopulate: true
    },
});
AnswerSchema.plugin(autopopulate);