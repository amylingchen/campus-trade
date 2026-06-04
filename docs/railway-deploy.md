# Railway Deployment

This guide deploys the Campus Trade backend and MySQL database on Railway, while the frontend remains on GitHub Pages.

## 1. Create Railway Project

1. Open Railway and sign in with GitHub.
2. Create a new project.
3. Choose `Deploy from GitHub repo`.
4. Select `amylingchen/campus-trade`.
5. For the backend service, set the root directory to:

```text
backend
```

Railway should detect the Node.js app from `backend/package.json`.

## 2. Add MySQL

1. In the same Railway project, click `New`.
2. Choose `Database`.
3. Choose `MySQL`.

Railway will provide these variables automatically:

```text
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
```

The backend reads those variables automatically. You do not need to duplicate them into `DB_*`.

## 3. Backend Variables

Set these variables on the backend service:

```text
JWT_SECRET=<generate-a-long-random-string>
FRONTEND_ORIGIN=http://localhost:5173,https://amylingchen.github.io
```

Railway sets `PORT` automatically.

## 4. Initialize Database

After the backend and MySQL services exist, run this once from the backend service shell or Railway command runner:

```bash
npm run db:init
```

This creates tables and inserts demo data.

Demo accounts:

```text
alex@mavs.uta.edu / password123
maya@mavs.uta.edu / password123
```

## 5. Get Backend URL

Open the backend service settings and generate or copy the public domain, for example:

```text
https://campus-trade-api-production.up.railway.app
```

Health check:

```text
https://campus-trade-api-production.up.railway.app/api/health
```

## 6. Connect GitHub Pages Frontend

In GitHub:

1. Open `Settings -> Secrets and variables -> Actions -> Variables`.
2. Add:

```text
VITE_API_BASE_URL=https://campus-trade-api-production.up.railway.app/api
VITE_SOCKET_URL=https://campus-trade-api-production.up.railway.app
```

3. Re-run the `Deploy frontend to GitHub Pages` workflow.

## 7. Notes

Railway's local filesystem is not durable across deployments. The current prototype stores uploaded files under `backend/uploads`, which is fine for a demo but not production-safe. For production, replace uploads with Cloudinary, S3, or another object storage provider.
