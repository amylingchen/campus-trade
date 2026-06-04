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

## GitHub Pages Frontend Deploy

This repository includes `.github/workflows/deploy-frontend.yml`. Every push to `main` builds `frontend/` and deploys the static app to GitHub Pages.

For a full online version, configure these GitHub repository variables after deploying the backend:

- `VITE_API_BASE_URL`: backend API URL, for example `https://your-api.example.com/api`
- `VITE_SOCKET_URL`: Socket.io server URL, for example `https://your-api.example.com`
