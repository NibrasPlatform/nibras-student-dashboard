# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Existing project guidance
- Main guidance currently lives in `README.md` (root) and `backend/README.md`.
- There is no existing `WARP.md`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` in this repository.

## Repository shape
- The repository is split into:
  - `backend/`: Node.js + Express + MongoDB API, plus Socket.io realtime events.
  - `client/`: static HTML/CSS/JS pages (no frontend build system or package manifest in this directory).
- Root `package.json` is an orchestration layer that delegates to backend scripts.

## Common commands
Run commands from repository root unless noted.

### Install dependencies
```powershell
npm run install:all
```
This installs root dependencies and then installs `backend/` dependencies.

### Run backend in development (with reload)
```powershell
npm run dev
```
Equivalent to running `npm run st` inside `backend/`.

### Run backend directly
```powershell
npm start
```
Equivalent to `node backend/src/server.js`.

### Realtime manual test
```powershell
npm run test:realtime
```
This runs `backend/test-realtime.js` (Socket.io client script).

### Run a single test script directly
```powershell
node backend/test-realtime.js
```

### Frontend development
- Frontend is static files under `client/`.
- Backend serves `client/` statically via `backend/src/app.js`, so running backend is enough for integrated local development.
- Entry login page in docs: `client/Login/loginPage/login.html`.

### Build/lint status
- No dedicated `build` or `lint` scripts are currently defined in root or backend `package.json`.
- `backend/package.json` contains `test:votes`, but its referenced file `backend/test-vote-routes.js` is currently missing.

## Environment and runtime
- Backend expects `.env` in `backend/` (see `backend/.env.example`).
- Important variables used by code:
  - `PORT` (used by `backend/src/server.js`)
  - `MONGO_URL` (used by `backend/src/config/database.js`)
  - `JWT_SECRET` (used by auth/token flow)
  - `SERVER_URL` (used by Socket.io CORS and realtime test script fallback)

## High-level architecture

### Backend request flow (layered)
- Route modules in `backend/src/routes/*.route.js` attach endpoints for auth, questions, comments, votes.
- Controllers in `backend/src/controllers/*.controller.js` handle HTTP details and delegate to services.
- Services in `backend/src/services/*.service.js` hold business logic and DB coordination.
- Mongoose models in `backend/src/model/*.model.js` define persistence entities (`User`, `Question`, `Comment`, `Vote`).
- Shared concerns:
  - auth middleware: `backend/src/middlewares/auth.middleware.js`
  - role middleware: `backend/src/middlewares/role.middleware.js`
  - validation middleware + validators: `backend/src/middlewares/validation.middleware.js`, `backend/src/validators/*`
  - app error helper: `backend/src/utils/errorHandler.js`

### Backend startup and hosting model
- `backend/src/server.js` creates an HTTP server from the Express app and initializes Socket.io.
- `backend/src/app.js` configures middleware/routes and serves static frontend files from `client/`.
- The backend is both:
  - JSON API server (`/auth`, `/questions`, `/comments`, `/votes`)
  - static file host for frontend pages.

### Realtime architecture
- Socket server setup: `backend/src/realtime/socket.js`
  - clients join per-question rooms named `question:<questionId>`.
- Domain event emitters: `backend/src/realtime/events.js`
  - `emitCommentCreated(...)` emits `comment:created`
  - `emitVoteUpdated(...)` emits `vote:updated`
- Services trigger events after persistence updates (not directly in routes), especially in comment/vote services.

### Data and domain behavior to keep in mind
- Vote behavior (`backend/src/services/vote.service.js`):
  - exactly one vote per user/target enforced by compound unique index (`Vote` model),
  - repeat same vote removes prior vote (toggle),
  - switching vote value updates aggregate counts,
  - self-voting is blocked.
- Comment behavior (`backend/src/services/comment.service.js`):
  - `Question.commentsCount` is maintained as comments are created/deleted,
  - comment list sorting prioritizes pinned and instructor comments, then score/time.

### Frontend architecture
- `client/` is organized by feature/page folders (Dashboard, Community, Courses, etc.), each typically with standalone HTML/CSS/JS.
- No SPA router/bundler: navigation is primarily file/path based.
- Frontend scripts call backend directly using hardcoded `http://localhost:5000` in key files like:
  - `client/Login/loginPage/login.js`
  - `client/Community/community.js`
- Auth token is stored in `localStorage` and sent as `Authorization: Bearer <token>`.

## Known inconsistencies to verify before refactors
- API docs in markdown sometimes mention `/api/...` prefixes, but runtime routes in `backend/src/app.js` are mounted without `/api`.
- Some route files include `router.all(...)` handlers referencing symbols not imported in that file (verify before editing route-level fallbacks).
