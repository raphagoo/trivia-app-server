import { createUser, login, listUsers, getUser, updateUser, deleteUser, createGuestUser, refreshToken } from "../controllers/userController.js";

export const userRoutes = (app) => {
    app.route('/user/register')
        .post(createUser);

    app.route('/user/refresh')
        .post(refreshToken);

    app.route('/user/guest')
        .post(createGuestUser);

    app.route('/user/login')
        .post(login);

    app.route('/user/list')
        .get(listUsers);

    app.route('/user/:id')
        .get(getUser);

    app.route('/user/:id')
        .put(updateUser);

    app.route('/user/:id')
        .delete(deleteUser);
}