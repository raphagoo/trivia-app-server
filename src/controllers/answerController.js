import mongoose from 'mongoose';
import { AnswerSchema } from '../models/answerModel.js';
const Answer = mongoose.model('Answer', AnswerSchema);


export const checkAnswer = (payload) => {
    return new Promise((resolve, reject) => {
        Answer.findById(payload.answer._id)
            .then((answer) => {
                if (answer) {
                    resolve(answer.correct);
                } else {
                    resolve(false);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};