import { Answer } from '../models/answerModel.js';


export const checkAnswer = (payload) => {
    return Answer.find({question: payload.question._id})
    .then((answers) => {
        const enteredAnswer = answers.find((answer) => {
            return String(answer._id) === String(payload.answer && payload.answer._id);
        })
        if(enteredAnswer && enteredAnswer.correct) {
            return {answerCorrectId: enteredAnswer._id, correct: true};
        }
        const correctAnswer = answers.find((answer) => answer.correct);
        return {answerCorrectId: correctAnswer._id, correct: false};
    });
};
