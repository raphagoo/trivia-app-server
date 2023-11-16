import { createRoom, listRooms, getRoom, updateRoom, deleteRoom } from "../controllers/roomController.js";

export const roomRoutes = (app) => {
    app.route('/room')
        .post(createRoom);

    app.route('/room')
        .get(listRooms);

    app.route('/room/:id')
        .get(getRoom);

    app.route('/room/:id')
        .put(updateRoom);

    app.route('/room/:id')
        .delete(deleteRoom);
}