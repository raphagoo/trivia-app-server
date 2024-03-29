import mongoose from 'mongoose';
import { AnswerSchema } from '../models/answerModel.js';
const Answer = mongoose.model('Answer', AnswerSchema);


export const checkAnswer = (payload) => {
    return new Promise((resolve, reject) => {
        Answer.find({question: payload.question._id})
        .then((answers) => {
            let enteredAnswer = answers.find((answer) => {
                return answer._id == payload.answer._id;
            })
            if(typeof enteredAnswer !== 'undefined' && enteredAnswer.correct) {
                resolve({answerCorrectId: enteredAnswer._id, correct: enteredAnswer.correct});
            }
            else {
                let correctAnswer = answers.find((answer) => {
                    return answer.correct;
                })
                resolve({answerCorrectId: correctAnswer._id, correct: false});
            }
        })
        .catch((err) => {
            reject(err);
        });
    });
};