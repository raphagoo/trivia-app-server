
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { QuestionSchema } from "../models/questionModel.js";
import { RoomSchema } from "../models/roomModel.js";
import { AnswerSchema } from '../models/answerModel.js';
const Question = mongoose.model('Question', QuestionSchema);
const Answer = mongoose.model('Answer', AnswerSchema);
const Room = mongoose.model('Room', RoomSchema);
dotenv.config();
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

export const getQuestions = (payload) => {
    return new Promise((resolve, reject) => {
        let difficulties = payload.difficulties.toLowerCase()
        let filters = '/questions?limit=' + payload.questions + '&difficulties=' + difficulties
        if(payload.tags !== '') {
            filters += '&tags=' + payload.tags
        } else {
            payload.tags = 'general'
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
                        return question; // Skip saving the question and associated answers
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
            const updatedQuestions = savedQuestions.map((question, index) => ({
                question: question._id,
                order: index + 1,
            }));
            const currentIndex = 0;
            Room.findOneAndUpdate({"_id": payload.room},  {
                    $push: { questions: { $each: updatedQuestions } },
                    $set: {
                        difficulties: payload.difficulties,
                        time: payload.time,
                        tags: payload.tags,
                        currentIndex: currentIndex,
                        currentQuestion: updatedQuestions[currentIndex].question
                    }
                }, { new: true, useFindAndModify: false })
            .then((room) => {
                resolve(room)
            })
        })
        .catch(error => {
            reject(error)
        });
    })
};