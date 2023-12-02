import { getAllTags, getQuestions } from "../controllers/triviaController.js";

export const triviaRoutes = (app) => {
    app.route('/trivia/tags')
        .get(getAllTags);
    app.route('/trivia/questions')
        .get(getQuestions);
}