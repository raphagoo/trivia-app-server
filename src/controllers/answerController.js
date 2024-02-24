import mongoose from 'mongoose';
import { AnswerSchema } from '../models/answerModel.js';
const Answer = mongoose.model('Answer', AnswerSchema);


export const checkAnswer = (payload) => {
    return new Promise((resolve, reject) => {
        Answer.findById(payload.answer._id)
        .then((answer) => {
            Answer.find({question: answer.question._id})
            .then((answers) => {
                let enteredAnswer = answers.find((answer) => {
                    return answer._id == payload.answer._id;
                })
                if(enteredAnswer.correct) {
                    resolve({answerCorrectId: enteredAnswer._id, correct: enteredAnswer.correct});
                }
                else {
                    let correctAnswer = answers.find((answer) => {
                        return answer.correct;
                    })
                    resolve({answerCorrectId: correctAnswer._id, correct: enteredAnswer.correct});
                }
            })
        })
        // Answer.find({question: payload.question._id})
        //     .then((answers) => {
        //         let enteredAnswer = answers.find((answer) => {
        //             return answer.answer === payload.answer;
        //         })
        //         console.log(enteredAnswer)
        //         if(enteredAnswer.correct) {
        //             resolve({answerCorrectId: enteredAnswer._id, correct: enteredAnswer.correct});
        //         }
        //         else {
        //             let correctAnswer = answers.find((answer) => {
        //                 return answer.correct;
        //             })
        //             resolve({answerCorrectId: correctAnswer._id, correct: enteredAnswer.correct});
        //         }
        //     })
        //     .catch((err) => {
        //         reject(err);
        //     });
    });
};