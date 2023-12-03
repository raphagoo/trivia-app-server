
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { QuestionSchema } from "../models/questionModel.js";
import { AnswerSchema } from '../models/answerModel.js';
const Question = mongoose.model('Question', QuestionSchema);
const Answer = mongoose.model('Answer', AnswerSchema);
dotenv.config();
const apiUrl = process.env.TRIVIA_API

export const getAllTags = (req, res) => {
    axios.get(apiUrl + '/totals-per-tag?difficulties=' + req.query.difficulties, {
        headers: {'Accept': 'application/json'}
    })
    .then((response) => {
        res.status(200).json(response.data);
    }).catch((err) => {
        res.status(400).send(err);
    })
};

export const getQuestions = (payload) => {
    return new Promise((resolve, reject) => {
        let filters = '/questions?limit=3&difficulties=' + payload.difficulties
        if(payload.tags !== '') {
            filters += '&tags=' + payload.tags
        }
        axios.get(apiUrl + filters, {
            headers: { 'Accept': 'application/json' }
        })
        .then((response) => {
            const questionsData = response.data;

            // Use Promise.all to wait for all promises to resolve
            return Promise.all(questionsData.map(questionData => {
                // Check if the question already exists in the database
                return Question.findOne({ question: questionData.question.text })
                .then((question) => {
                    if (question) {
                        return null; // Skip saving the question and associated answers
                    }

                    const newQuestion = new Question({
                        category: questionData.category,
                        difficulty: questionData.difficulty,
                        question: questionData.question.text,
                    });
                
                    // Save the new question
                    return newQuestion.save()
                    .then(savedQuestion => {
                        const answersPromises = [];
                    
                        // Use find instead of response.data.find to get the correct original question
                        const originalQuestion = questionsData.find(q => q.question.text === savedQuestion.question);
                    
                        originalQuestion.incorrectAnswers.forEach(answer => {
                            const incorrectAnswer = new Answer({
                                answer: answer,
                                correct: false,
                                question: savedQuestion._id,
                            });
                        
                            answersPromises.push(incorrectAnswer.save().then(savedAnswer => {
                                // Push the new answer's ID into the answers array of the related question
                                savedQuestion.answers.push(savedAnswer._id);
                            }));
                        });
                    
                        const correctAnswer = new Answer({
                            answer: originalQuestion.correctAnswer,
                            correct: true,
                            question: savedQuestion._id,
                        });
                    
                        answersPromises.push(correctAnswer.save().then(savedAnswer => {
                            // Push the new answer's ID into the answers array of the related question
                            savedQuestion.answers.push(savedAnswer._id);
                        }));
                    
                            // Return a promise that resolves when all answers are saved and the question is updated
                            return Promise.all(answersPromises).then(() => savedQuestion.save());
                    });
                });
            }));
        })
        .then(savedQuestions => {
            // Filter out null values (skipped questions)
            const filteredSavedQuestions = savedQuestions.filter(question => question !== null);

            return Question.find({ _id: { $in: filteredSavedQuestions.map(q => q._id) } })
            .populate('answers') // Populate the 'answers' field in the questions
            .exec();
        })
        .then(updatedQuestions => {
            resolve(updatedQuestions)
        })
        .catch(error => {
            reject(error)
        });
    })
};
