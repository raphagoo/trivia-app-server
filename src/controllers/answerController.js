import { Answer } from '../models/answerModel.js';
import { User } from '../models/userModel.js';

const pointsForDifficulty = (difficulty) => {
    switch (difficulty) {
        case 'easy': return 10;
        case 'medium': return 20;
        case 'hard': return 30;
        default: return 0;
    }
};

export const checkAnswer = (payload) => {
    return Answer.find({question: payload.question._id})
    .then((answers) => {
        const enteredAnswer = answers.find((answer) => {
            return String(answer._id) === String(payload.answer && payload.answer._id);
        })
        const correctAnswer = answers.find((answer) => answer.correct);
        const result = (enteredAnswer && enteredAnswer.correct)
            ? {answerCorrectId: enteredAnswer._id, correct: true}
            : {answerCorrectId: correctAnswer._id, correct: false};

        if (payload.user && payload.user._id) {
            User.findByIdAndUpdate(payload.user._id, {
                $inc: {
                    'stats.totalAnswers': 1,
                    'stats.correctAnswers': result.correct ? 1 : 0,
                    'stats.totalScore': result.correct ? pointsForDifficulty(correctAnswer.question.difficulty) : 0,
                }
            }).catch((err) => console.error('Failed to update user stats:', err));
        }

        return result;
    });
};
