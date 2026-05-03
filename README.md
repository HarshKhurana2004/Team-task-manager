# Team Task Manager

A full-stack task management web app built with React, Node.js, Express, and MongoDB.

## Features
- User authentication (JWT)
- Create and join projects
- Admin/Member roles
- Create, assign, and track tasks
- Dashboard with stats (total, by status, overdue, per user)

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Atlas)
- **Auth**: JWT

---

## 🚀 Running Locally

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` in the backend folder:
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:
```
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/taskdb
JWT_SECRET=any_long_random_string
PORT=5000
```

### 3. Run the app

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 🌐 Deploying to Railway

1. Push to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo
4. Set Root Directory to: `backend`
5. Add environment variables in Railway dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
6. Build Command: `cd ../frontend && npm install && npm run build && cd ../backend && npm install`
7. Start Command: `node server.js`

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Get current user

### Projects
- `GET    /api/projects` — List my projects
- `GET    /api/projects/:id` — Get project
- `POST   /api/projects` — Create project
- `POST   /api/projects/:id/members` — Add member
- `DELETE /api/projects/:id/members/:userId` — Remove member
- `DELETE /api/projects/:id` — Delete project

### Tasks
- `GET    /api/tasks/project/:projectId` — List tasks
- `GET    /api/tasks/stats/:projectId` — Dashboard stats
- `POST   /api/tasks` — Create task (admin)
- `PUT    /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task (admin)
