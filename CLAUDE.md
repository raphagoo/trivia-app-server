# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Real-time multiplayer trivia API: Express 5 REST endpoints + Socket.io events over a shared HTTP server (`PORT` env var, default 3000), MongoDB via Mongoose. ES modules throughout (`"type": "module"`).

`index.js` is a thin entrypoint that wires the pieces together: `src/config/database.js` (env-based Mongo connection), `src/app.js` (`createApp()` — Express middleware + routes), `src/sockets/index.js` (`registerSocketHandlers(io)` — all Socket.io events).

## Commands

- `npm start` — run the server (plain node)
- `npm run dev` — nodemon with auto-reload (plain node; Babel is only used by jest's transform)
- `npm test` — jest (see test setup below)
- `npx jest -t "test name"` — run a single test
- `npm run fixtures` — drop the test database and reload fixtures from `fixtures/fixtures.js`
- `npm run scripts` — one-off script that uses DeepSeek to generate answers for questions with none (`src/scripts/fillupMissingAnswers.js`)

### Environment

`NODE_ENV` is mandatory — the server calls `process.exit(1)` if it isn't `production`, `test`, or `development`. It selects the DB: `production` → `MONGODB_URL`, `test` → `MONGO_TEST_URL`, `development` → hardcoded `mongodb://localhost/trivia-app`.

Other `.env` variables: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` (JWT), `TRIVIA_API` (external question source), `FRONTEND_URL` (prod CORS), `DEEPSEEK_API_KEY` (fillup script only).

### Test setup

Tests hit a real MongoDB (no mocks). Before `npm test`: have Mongo running, set `MONGO_TEST_URL` and `NODE_ENV=test` in `.env`, and run `npm run fixtures` to seed it. CI (`.github/workflows/node.js.yml`) does exactly this sequence against a `mongo` service container.

## Architecture

### Dual API surface, shared controllers

Controllers in `src/controllers/` serve two callers with two distinct function shapes:

1. **REST**: `(req, res)` Express handlers, wired in `src/routes/*.js` (routes are functions that take `app` and register paths).
2. **Socket.io**: `(payload) => Promise` functions (e.g. `startGame`, `nextQuestion`, `checkAnswer`, `getQuestions`), called from the socket event handlers in `src/sockets/index.js`.

Game flow lives in the socket events (`create_room`, `join_room`, `generate_quizz`, `start_game`, `next_question`, `check_answer`, `end_game`). REST covers auth and CRUD.

Socket emission scope: on `create_room`/`join_room` the server joins the socket to a Socket.io room keyed by the Mongo room id (`resolveRoomId` accepts a room id string, a room object, or either under `payload.room`) and stores `roomId`/`user` in `socket.data`. Game events are emitted only to that room via `io.to(roomId)`; `create_room` also broadcasts globally so lobby clients see new rooms. If no room id can be resolved from a payload, emission falls back to a global `io.emit` (legacy-client compatibility). Failed handlers emit a `game_error` event (`{event, message}`) to the originating socket. On `disconnect`, the server removes the tracked user from their room and emits `leave_room` to the remaining players.

### Models

Files in `src/models/` export both the `Schema` and the compiled model (e.g. `export const Room = mongoose.model('Room', RoomSchema)`); consumers import the model, never compile their own. Relations use `mongoose-autopopulate`, so referenced docs (room users, question answers) arrive populated by default.

Two `toJSON` transforms are load-bearing anti-cheat measures:
- `QuestionSchema` strips the `correct` flag from answers and shuffles them, so API responses never reveal the right answer — correctness is only checked server-side in `answerController.checkAnswer`.
- `RoomSchema` deletes the `questions` array so clients can't see the full quiz ahead of time; the current question is fetched via `GET /question/:id` (room id) or delivered by the `next_question` event.

### Questions come from an external API, cached in Mongo

`triviaController.getQuestions` fetches from `TRIVIA_API`, dedupes by question text against the `Question` collection, saves new questions + their `Answer` docs (one `correct: true` per question), then attaches ordered question refs to the room and sets `currentIndex`/`currentQuestion`. `endGame` resets all of that room state.

### Auth

JWT: access token 1h, refresh token 1y (`userController`), both from `Bearer` headers. Protected endpoints call `verifyJwt(req)` from `src/services/jwtVerification.js` manually inside the controller — there is no Express middleware; most room/user CRUD endpoints are actually unprotected. Passwords are bcrypt-hashed in a `UserSchema.pre('save')` hook — never set hashes manually. Guest users (`POST /user/guest`) get a random username and a shared dummy password.

## Conventions

- Promise chains with `.then/.catch`, not async/await — match this style in controllers.
- Controller error handling: `400` + err body on DB errors, `404` on null lookups, `401` on failed JWT.
- AI code calls DeepSeek (OpenAI-compatible API) through the official `openai` package with a custom `baseURL` — see `src/scripts/fillupMissingAnswers.js`. DeepSeek supports JSON mode but not `json_schema` structured outputs; describe the format in the prompt and validate in code.
