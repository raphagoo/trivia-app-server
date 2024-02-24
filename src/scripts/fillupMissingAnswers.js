import mongoose, { set } from 'mongoose';
import dotenv from 'dotenv';
import { QuestionSchema } from "../models/questionModel.js";
import { AnswerSchema } from '../models/answerModel.js';
const Question = mongoose.model('Question', QuestionSchema);
const Answer = mongoose.model('Answer', AnswerSchema);
import axios from 'axios';
import OpenAI from 'openai';
import { ChatGPTAPI } from 'chatgpt'
dotenv.config();

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/trivia-app');


const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
})

Question.find({answers: {$size: 0}})
.then((questions) => {
    questions.forEach((question) => {
        setTimeout(() => {
        api.sendMessage('Make three incorrect but credible answers and one correct answer to the following question : ' + question.question + ', return the response to me as a simple json following this format { "incorrect": [string, string, string], "correct": string }, do not format it.')
        .then((response) => {
            let answer = response.text;
            console.log(answer);
            let parsedAnswer = JSON.parse(answer);
            parsedAnswer.incorrect.forEach(answer => {
                let newAnswer = new Answer({answer: answer, question: questions[0]._id, correct: false});
                newAnswer.save()
                .then((answer) => {
                    console.log('Answer has been saved');
                })
                .catch((err) => {
                    console.log(err);
                })
            });
            let newAnswer = new Answer({answer: parsedAnswer.correct, question: questions[0]._id, correct: true});
            newAnswer.save()
            .then((answer) => {
                console.log('Answer has been saved');
            })
            .catch((err) => {
                console.log(err);
            })
            console.log(questions[0]._id + ' has been filled up')
        })
    }, 1000)
    })
})