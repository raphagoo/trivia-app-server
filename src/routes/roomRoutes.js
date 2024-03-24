import { createRoom, joinRoom, listRooms, getRoom, updateRoom, deleteRoom, getQuestion } from "../controllers/roomController.js";

export const roomRoutes = (app) => {
    app.route('/room')
        .post(createRoom);

    app.route('/room/join/:id')
        .post(joinRoom);

    app.route('/room')
        .get(listRooms);

    app.route('/room/:id')
        .get(getRoom);

    app.route('/question/:id')
        .get(getQuestion);

    app.route('/room/:id')
        .put(updateRoom);

    app.route('/room/:id')
        .delete(deleteRoom);
}