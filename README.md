# TeamFlow — Team Task Manager

A full-stack team task management web app with role-based access control, built for the Ethara AI placement drive.

## Live Demo
🔗 [Your Railway URL here]

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (Bearer token) |
| Deploy | Railway |

## Features

- **Authentication** — Signup / Login with JWT, persistent sessions
- **Role-based access** — Global ADMIN vs MEMBER; per-project ADMIN vs MEMBER
- **Projects** — Create, view, delete projects; add/remove members with roles
- **Kanban board** — Tasks organized by status: To do → In progress → In review → Done
- **Task management** — Create tasks with title, description, priority, due date, assignee
- **Dashboard** — Stats overview, my tasks, overdue tasks, recent activity
- **Comments** — Thread comments on any task
- **Overdue detection** — Tasks past due date highlighted in red
- **Validations** — Input validation on all API routes

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud)

### Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd teamflow
npm run install:all

# 2. Configure backend env
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL and JWT_SECRET

# 3. Setup DB
npm run db:push    # Create tables
npm run db:seed    # Add demo data

# 4. Run dev servers (two terminals)
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173
```

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@teamflow.dev | admin123 |
| Member | alice@teamflow.dev | member123 |
| Member | bob@teamflow.dev | member123 |

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | Any | List my projects |
| POST | `/api/projects` | Any | Create project |
| GET | `/api/projects/:id` | Member | Get project + tasks |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Delete project |
| POST | `/api/projects/:id/members` | Project Admin | Add member |
| DELETE | `/api/projects/:id/members/:uid` | Project Admin | Remove member |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks` | Any | List tasks (filterable) |
| POST | `/api/tasks` | Member | Create task |
| GET | `/api/tasks/:id` | Member | Get task + comments |
| PUT | `/api/tasks/:id` | Creator/Assignee/Admin | Update task |
| DELETE | `/api/tasks/:id` | Creator/Admin | Delete task |
| POST | `/api/tasks/:id/comments` | Member | Add comment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats, overdue, recent |

## Role-Based Access Control

```
Global Roles:
  ADMIN  → Can see all projects/tasks, manage users
  MEMBER → Can only see projects they belong to

Project Roles:
  ADMIN  → Create/edit/delete tasks, add/remove members
  MEMBER → View board, update status of assigned tasks, comment
```

## Deployment on Railway

1. Push code to GitHub
2. Create new Railway project → "Deploy from GitHub"
3. Add a PostgreSQL plugin (Railway provides one free)
4. Set environment variables:
   ```
   DATABASE_URL    (auto-set by Railway Postgres plugin)
   JWT_SECRET      your-random-secret-string
   NODE_ENV        production
   ```
5. Railway auto-detects `railway.toml` and builds/deploys

## Project Structure

```
teamflow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # DB models
│   └── src/
│       ├── index.js            # Express app entry
│       ├── middleware/
│       │   └── auth.js         # JWT + role middleware
│       ├── routes/
│       │   ├── auth.js
│       │   ├── projects.js
│       │   ├── tasks.js
│       │   ├── users.js
│       │   └── dashboard.js
│       └── seed.js             # Demo data
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetail.jsx  # Kanban board
│       │   └── TaskDetail.jsx     # Task + comments
│       ├── components/
│       │   └── Layout.jsx      # Sidebar nav
│       ├── context/
│       │   └── AuthContext.jsx
│       └── api.js              # Axios instance
└── railway.toml
```
