import mongoose from 'mongoose';
import { default as autopopulate } from "mongoose-autopopulate";

const ObjectId = mongoose.Schema.Types.ObjectId;

const Schema = mongoose.Schema;


const shuffleArray = array => {
    // Use the Fisher-Yates (Knuth) shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

export const QuestionSchema = new Schema({
    question: {
        type: String,
        required: 'question required'
    },
    category: {
        type: String,
        required: 'category required'
    },
    difficulty: {
        type: String,
        required: 'difficulty required'
    },
    answers:[{
        type: ObjectId,
        ref: 'Answer',
        autopopulate: true
    }],
}, 
{
    toJSON: {
        transform: function (doc, ret) {
            // Exclude the 'correct' field from the returned JSON
            ret.answers = ret.answers.map(answer => ({
                _id: answer._id,
                answer: answer.answer,
              // You can include other fields from the 'Answer' model if needed
            }));
            shuffleArray(ret.answers);
            delete ret.correct;
        }
    }
});
QuestionSchema.plugin(autopopulate);