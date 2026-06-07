# AI-Powered E-commerce Recommendation System 

## Structure

root/
├── backend/      # Node.js + Express + MongoDB
├── frontend/     # React 18 + Vite + Tailwind
└── package.json  # Workspace root

## Stack
**Backend:** Express, MongoDB, JWT (access + refresh), bcryptjs, Helmet, Upstash Redis  
**Frontend:** React 18, Vite, Tailwind, React Router v6, Axios, TanStack Query, Zustand, Recharts  
**AI:** Gemini 2.0 Flash + Redis caching

## Setup
```bash
# Install all deps
npm install && npm install --workspace=backend

# Copy env files and fill in values
cp backend/.env.example backend/.env

# Seed database
cd backend && npm run seed

# Run both servers
npm run dev
```

## Roles
| Role | Access |
|------|--------|
| `user` | Browse, recommendations, purchase |
| `admin` | + Analytics dashboard, product management |

