# Playto Community Feed

A prototype community feed with threaded comments and a dynamic 24-hour leaderboard.

## Features
- **Community Feed**: View and post text updates.
- **Threaded Comments**: Reddit-style nested discussions.
- **Dynamic Leaderboard**: Top 5 users based on karma earned in the **last 24 hours only**.
- **Karma System**: 
  - Post Like = 5 Karma
  - Comment Like = 1 Karma
- **Tech Stack**: Django (DRF), React (Vite + Tailwind), SQLite.

## How to Run

### Option 1: Docker (Recommended)
1. Ensure you have Docker installed.
2. Run: `docker-compose up --build`
3. Frontend: `http://localhost:5173`
4. Backend: `http://localhost:8000`

### Option 2: Local Manual Setup

#### Backend
1. `cd backend`
2. `python3 -m pip install django djangorestframework django-cors-headers`
3. `python3 manage.py migrate`
4. `python3 manage.py runserver`
5. (Optional) Populate dummy data: `python3 populate_data.py`

#### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Credentials
- **Admin**: `admin` / `admin`
- **Test Users**: `testuser` / `password123` (or run `populate_data.py` for more)

## Technical Architecture
Refer to [EXPLAINER.md](./EXPLAINER.md) for details on N+1 optimization, Leaderboard logic, and AI audit.
