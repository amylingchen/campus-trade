# Campus Trade

Campus Trade is a full-stack campus marketplace prototype for students to buy and sell second-hand items inside a school community. It supports school-aware listings, image uploads, favorites, seller profiles, and real-time chat.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, Socket.io
- Database: MySQL
- Tests: Playwright

## Project Structure

```text
backend/   Express API, Socket.io chat, MySQL scripts
frontend/  React marketplace UI
docs/      Product, frontend, backend, database, and integration specs
tests/     API, socket, and E2E smoke tests
```

## Local Setup

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run start
```

Update `backend/.env` with your local MySQL credentials before starting the server.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:4000/api` for API requests.

## Tests

```bash
npm install
npm run test:e2e
```

## Notes

GitHub Pages can host the frontend build only. The backend API, MySQL database, Socket.io server, and uploaded images need a backend hosting platform such as Render, Railway, Fly.io, or a VPS.
