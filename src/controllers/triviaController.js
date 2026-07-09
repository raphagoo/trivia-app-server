import axios from 'axios';
import dotenv from 'dotenv';
import { Question } from "../models/questionModel.js";
import { Room } from "../models/roomModel.js";
import { Answer } from '../models/answerModel.js';
dotenv.config({ quiet: true });
const apiUrl = process.env.TRIVIA_API

export const getAllTags = (req, res) => {
    let difficulties = req.query.difficulties.toLowerCase()
    axios.get(apiUrl + '/totals-per-tag?difficulties=' + difficulties, {
        headers: {'Accept': 'application/json'}
    })
    .then((response) => {
        res.status(200).json(response.data);
    }).catch((err) => {
        res.status(400).send(err);
    })
};

// Saves a question fetched from the external API along with its answers,
// or returns the existing document when the question text is already known.
const findOrCreateQuestion = (questionData) => {
    return Question.findOne({ question: questionData.question.text })
    .then((question) => {
        if (question) {
            return question; // Skip saving the question and associated answers
        }

        const newQuestion = new Question({
            category: questionData.category,
            difficulty: questionData.difficulty,
            question: questionData.question.text,
        });

        return newQuestion.save()
        .then(savedQuestion => {
            const answersData = questionData.incorrectAnswers
                .map(answer => ({ answer, correct: false }))
                .concat([{ answer: questionData.correctAnswer, correct: true }]);

            const answersPromises = answersData.map(({ answer, correct }) => {
                return new Answer({ answer, correct, question: savedQuestion._id })
                .save()
                .then(savedAnswer => {
                    savedQuestion.answers.push(savedAnswer._id);
                });
            });

            return Promise.all(answersPromises).then(() => savedQuestion.save());
        });
    });
};

export const getQuestions = (payload) => {
    let difficulties = payload.difficulties.toLowerCase()
    let filters = '/questions?limit=' + payload.questions + '&difficulties=' + difficulties
    if(payload.tags !== '') {
        filters += '&tags=' + payload.tags
    } else {
        payload.tags = 'general'
    }
    return axios.get(apiUrl + filters, {
        headers: { 'Accept': 'application/json' }
    })
    .then((response) => {
        return Promise.all(response.data.map(findOrCreateQuestion));
    })
    .then(savedQuestions => {
        const updatedQuestions = savedQuestions.map((question, index) => ({
            question: question._id,
            order: index + 1,
        }));
        const currentIndex = 0;
        return Room.findOneAndUpdate({"_id": payload.room},  {
                $push: { questions: { $each: updatedQuestions } },
                $set: {
                    difficulties: payload.difficulties,
                    time: payload.time,
                    tags: payload.tags,
                    currentIndex: currentIndex,
                    currentQuestion: updatedQuestions[currentIndex].question
                }
            }, { returnDocument: 'after' });
    });
};
