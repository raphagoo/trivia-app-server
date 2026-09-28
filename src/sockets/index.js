import { endGame, removeUserFromRoom, startGame, nextQuestion } from '../controllers/roomController.js';
import { checkAnswer } from '../controllers/answerController.js';
import { getQuestions } from '../controllers/triviaController.js';

// Accepts the payload shapes clients send today: a room id string, a populated
// room object, or a payload carrying either under `room`.
const resolveRoomId = (payload) => {
    if (!payload) return null;
    if (payload.room) {
        return typeof payload.room === 'object' ? String(payload.room._id) : String(payload.room);
    }
    if (payload._id) return String(payload._id);
    return null;
};

export const registerSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected');

        // Falls back to a global broadcast when the payload carries no room id,
        // so clients that predate room scoping keep receiving events.
        const emitToRoom = (roomId, event, data) => {
            const target = roomId ? io.to(roomId) : io;
            target.emit(event, data);
        };

        const emitError = (event, err) => {
            console.error(`Socket event "${event}" failed:`, err);
            socket.emit('game_error', { event, message: err instanceof Error ? err.message : String(err) });
        };

        const joinSocketRoom = (payload) => {
            const roomId = resolveRoomId(payload);
            if (roomId) {
                socket.join(roomId);
                socket.data.roomId = roomId;
                if (payload.user) {
                    socket.data.user = payload.user;
                }
            }
            return roomId;
        };

        const leaveSocketRoom = (roomId) => {
            if (roomId) {
                socket.leave(roomId);
            }
            delete socket.data.roomId;
            delete socket.data.user;
        };

        socket.on('create_room', (payload) => {
            joinSocketRoom(payload);
            io.emit('create_room', payload); // Global so lobby clients see the new room
        });

        socket.on('join_room', (payload) => {
            const roomId = joinSocketRoom(payload);
            emitToRoom(roomId, 'join_room', payload);
        });

        socket.on('leave_room', payload => {
            const roomId = resolveRoomId(payload) || socket.data.roomId;
            removeUserFromRoom(payload)
            .then(() => {
                emitToRoom(roomId, 'leave_room', payload);
                leaveSocketRoom(roomId);
            })
            .catch((err) => emitError('leave_room', err));
        });

        socket.on('generate_quizz', payload => {
            getQuestions(payload)
            .then((room) => {
                emitToRoom(resolveRoomId(payload), 'generate_quizz', {room});
            })
            .catch((err) => emitError('generate_quizz', err));
        });

        socket.on('next_question', payload => {
            nextQuestion(payload)
            .then((response) => {
                emitToRoom(resolveRoomId(payload), 'next_question', response);
            })
            .catch((err) => emitError('next_question', err));
        });

        socket.on('start_game', payload => {
            startGame(payload)
            .then((room) => {
                emitToRoom(resolveRoomId(payload), 'started_game', room);
            })
            .catch((err) => emitError('start_game', err));
        });

        socket.on('check_answer', payload => {
            checkAnswer(payload)
            .then((answer) => {
                emitToRoom(resolveRoomId(payload), 'checked_answer', {correct: answer.correct, answerCorrectId: answer.answerCorrectId, userId: payload.user._id});
            })
            .catch((err) => emitError('check_answer', err));
        });

        socket.on('end_game', payload => {
            endGame(payload)
            .then((room) => {
                emitToRoom(resolveRoomId(payload), 'end_game', room);
            })
            .catch((err) => emitError('end_game', err));
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
            const { roomId, user } = socket.data;
            if (roomId && user) {
                removeUserFromRoom({ room: roomId, user })
                .then(() => {
                    io.to(roomId).emit('leave_room', { room: roomId, user });
                })
                .catch((err) => console.error('Disconnect cleanup failed:', err));
            }
        });
    });
};
