import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
// Load the project root .env regardless of the directory the script is run from
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
import mongoose from 'mongoose';
import OpenAI from 'openai';
import { connectDatabase } from '../config/database.js';
import { Question } from '../models/questionModel.js';
import { Answer } from '../models/answerModel.js';

if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY is not set');
    process.exit(1);
}
if (!['production', 'test', 'development'].includes(process.env.NODE_ENV)) {
    console.error('NODE_ENV must be set to production, test or development — it selects the database (e.g. $env:NODE_ENV = \'development\')');
    process.exit(1);
}

// DeepSeek exposes an OpenAI-compatible API, so the openai SDK is reused with a different baseURL
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});
const MAX_ATTEMPTS = 2;

const isValidGeneration = (parsed) => {
    if (!parsed || !Array.isArray(parsed.incorrect) || parsed.incorrect.length !== 3) return false;
    if (typeof parsed.correct !== 'string' || parsed.correct.trim() === '') return false;
    if (parsed.incorrect.some((a) => typeof a !== 'string' || a.trim() === '')) return false;
    // the correct answer must not also appear among the incorrect ones
    return !parsed.incorrect.some((a) => a.trim().toLowerCase() === parsed.correct.trim().toLowerCase());
};

const generateAnswers = async (question) => {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            // DeepSeek does not support json_schema structured outputs, only JSON mode —
            // the format must be spelled out in the prompt and is validated below.
            const completion = await deepseek.chat.completions.create({
                model: 'deepseek-chat',
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'You write answers for a trivia game. Answers must be short, plausible and distinct from each other. Provide exactly three incorrect answers and one correct answer, as JSON following exactly this format: { "incorrect": [string, string, string], "correct": string }',
                    },
                    {
                        role: 'user',
                        content: 'Question: ' + question.question,
                    },
                ],
            });
            const parsed = JSON.parse(completion.choices[0].message.content);
            if (!isValidGeneration(parsed)) {
                throw new Error('generated answers failed validation: ' + JSON.stringify(parsed));
            }
            return parsed;
        } catch (err) {
            lastError = err;
            console.warn(`attempt ${attempt}/${MAX_ATTEMPTS} failed for "${question.question}": ${err.message}`);
        }
    }
    throw lastError;
};

const linkAnswers = async (question, answerIds) => {
    question.answers = answerIds;
    await question.save();
};

// Answers may exist in the collection without being linked on the question
// (leftovers from an old bug). Reuse them when consistent, discard them otherwise.
const repairFromOrphans = async (question) => {
    const orphans = await Answer.find({ question: question._id });
    if (orphans.length === 0) return false;

    const corrects = orphans.filter((a) => a.correct);
    if (orphans.length === 4 && corrects.length === 1) {
        await linkAnswers(question, orphans.map((a) => a._id));
        return true;
    }
    await Answer.deleteMany({ question: question._id });
    return false;
};

const fillQuestion = async (question) => {
    if (await repairFromOrphans(question)) {
        console.log(`${question._id} repaired from existing answers`);
        return 'repaired';
    }

    const generated = await generateAnswers(question);
    const answersData = generated.incorrect
        .map((answer) => ({ answer, correct: false }))
        .concat([{ answer: generated.correct, correct: true }]);

    const saved = await Promise.all(answersData.map(({ answer, correct }) =>
        new Answer({ answer, correct, question: question._id }).save()
    ));
    await linkAnswers(question, saved.map((a) => a._id));
    console.log(`${question._id} has been filled up`);
    return 'filled';
};

await connectDatabase();

const questions = await Question.find({ answers: { $size: 0 } });
console.log(`${questions.length} question(s) without answers`);

const counts = { filled: 0, repaired: 0, failed: 0 };
for (const question of questions) {
    try {
        counts[await fillQuestion(question)]++;
    } catch (err) {
        counts.failed++;
        console.error(`FAILED ${question._id} ("${question.question}"): ${err.message}`);
    }
}

console.log(`done — filled: ${counts.filled}, repaired: ${counts.repaired}, failed: ${counts.failed}`);
await mongoose.connection.close();
process.exit(counts.failed > 0 ? 1 : 0);
