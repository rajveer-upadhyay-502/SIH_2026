# 📅 Smart Timetable — SIH 2026

> An intelligent, AI-assisted academic timetable scheduling system built for Smart India Hackathon 2026. Automates conflict-free timetable generation for colleges with multi-role access for Admins, Coordinators, Faculty, and Students.

---

## 🚀 Live Demo

> Run locally with `npm run dev` — see [Getting Started](#getting-started) below.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Role-Based Access](#role-based-access)
- [Timetable Engine](#timetable-engine)
- [Firebase Collections](#firebase-collections)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)

---

## Overview

**Smart Timetable** is a full-stack web application that automates the generation of academic timetables for educational institutions. It eliminates scheduling conflicts, respects faculty availability and workload constraints, handles room assignments, and produces multiple optimized timetable options for coordinators to review and publish.

Built as an entry for **Smart India Hackathon 2026**, the system is designed to be:
- ⚡ Fast — instant multi-option timetable generation
- 🔒 Secure — role-based authentication via Firebase
- 🧠 Smart — constraint-aware scheduling engine (V2)
- 📱 Responsive — works across devices

---

## Features

### 🛡️ Authentication & Authorization
- Email/password login and signup via Firebase Authentication
- Role-based routing: `admin`, `coordinator`, `faculty`, `student`
- Protected routes — unauthorized access redirects gracefully
- Persistent auth session with `onAuthStateChanged` listener

### 🏫 Admin Portal
- College-wide configuration (name, university, academic year, working hours)
- Room management — add/delete classrooms and labs with capacity and type
- Faculty management — register faculty members with department and workload limits
- User management for faculty and student accounts

### 📋 Coordinator Portal
- Create and configure timetable generation requests per course, semester, and section
- Define subjects with weekly session counts, duration, and room type requirements
- Assign faculty to subjects before scheduling
- Receive multiple optimized timetable options ranked by score
- Review, compare, and publish the best timetable option
- Published timetables are versioned — old ones are automatically archived

### 👨‍🏫 Faculty Portal
- View all published timetables where the faculty member is assigned
- See personal weekly schedule with day-by-day breakdown
- Manage availability preferences (used by the scheduling engine)

### 🎓 Student Portal
- View published timetables for their program, semester, and section

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 |
| Backend / Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Build Tool | Vite |
| Linting | ESLint 10 |

---

## Project Structure

```
smart-timetable/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                    # Static assets
│   ├── components/
│   │   ├── ProtectedRoute.jsx     # Blocks unauthenticated access
│   │   └── RoleRoute.jsx          # Blocks unauthorized role access
│   ├── context/
│   │   └── AuthContext.jsx        # Global auth state (user + profile)
│   ├── firebase/
│   │   └── config.js              # Firebase app initialization
│   ├── pages/
│   │   ├── Login.jsx              # Login page
│   │   ├── Signup.jsx             # Registration page
│   │   ├── Unauthorized.jsx       # 403 page
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx # Admin home with stats & navigation
│   │   │   └── CollegeSetup.jsx   # College config, rooms, faculty mgmt
│   │   ├── coordinator/
│   │   │   ├── CoordinatorDashboard.jsx   # Coordinator home
│   │   │   ├── CreateTimetable.jsx        # Timetable generation form
│   │   │   └── TimetableResults.jsx       # View & publish results
│   │   ├── faculty/
│   │   │   └── FacultyDashboard.jsx       # Faculty schedule & preferences
│   │   └── student/
│   │       └── StudentDashboard.jsx       # Student timetable view
│   ├── services/
│   │   ├── authService.js         # signup, login, logout, getUserData
│   │   ├── collegeConfigService.js# College config, rooms, faculty CRUD
│   │   ├── facultyService.js      # Faculty availability & profile ops
│   │   ├── timetableService.js    # Publish & fetch timetables
│   │   ├── userService.js         # User record management
│   │   └── scheduler/
│   │       └── timetableEngine.js # Core scheduling algorithm (V2)
│   ├── App.jsx                    # Route definitions
│   ├── App.css                    # Global app styles
│   ├── main.jsx                   # React app entry point
│   └── index.css                  # Base CSS reset
├── index.html                     # HTML shell
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint rules
└── package.json
```

---

## Role-Based Access

The app enforces strict role-based access control at the routing level.

| Route | Allowed Role |
|---|---|
| `/login` | Public |
| `/signup` | Public |
| `/admin` | `admin` |
| `/admin/setup` | `admin` |
| `/coordinator` | `coordinator` |
| `/coordinator/create-timetable` | `coordinator` |
| `/coordinator/timetable-results` | `coordinator` |
| `/faculty` | `faculty` |
| `/student` | `student` |

After login, users are automatically redirected to their role-specific dashboard via the `HomeRedirect` component in `App.jsx`.

---

## Timetable Engine

The core intelligence of this project lives in `src/services/scheduler/timetableEngine.js` — a **V2 constraint-based scheduling engine** that generates conflict-free academic timetables.

### Constraints Handled

| Constraint | Description |
|---|---|
| ✅ Exact weekly sessions | Each subject gets exactly the required number of sessions per week |
| ✅ Subject distribution | Subjects are spread across different days |
| ✅ Faculty availability | Faculty are only scheduled during their available windows |
| ✅ Faculty max hours/day | Daily teaching hour cap per faculty is enforced |
| ✅ Faculty max hours/week | Weekly workload limit per faculty is respected |
| ✅ Faculty max classes/day | Max number of class slots per faculty per day |
| ✅ Faculty conflicts | No faculty is double-booked at the same time |
| ✅ Batch conflicts | No student batch has overlapping classes |
| ✅ Room conflicts | No room is assigned to two classes simultaneously |
| ✅ Room capacity | Room must fit the student count |
| ✅ Room type | Labs scheduled in lab rooms; lectures in classrooms |
| ✅ Multi-period classes | Labs and long sessions span consecutive periods |
| ✅ Break slots | Lunch and other breaks are automatically excluded |
| ✅ Sequential scheduling | Periods are generated sequentially from working hours |
| ✅ Schedule compactness | Student timetables minimise gaps between classes |
| ✅ Multiple options | Engine produces several ranked timetable alternatives |

### How It Works

1. **Period Generation** — Daily teaching slots are created from the college's configured working hours, period duration, and break times.
2. **Constraint Collection** — The engine reads faculty availability, room inventory, and subject requirements.
3. **Backtracking Scheduler** — For each subject session, the engine tries available (day, period, room, faculty) combinations, validating all constraints before assigning.
4. **Scoring** — Each generated timetable is scored based on compactness, faculty satisfaction, and distribution quality.
5. **Multiple Results** — Several attempts produce multiple valid timetables with different layouts, all ranked by score for the coordinator to choose from.

---

## Firebase Collections

The app uses the following Firestore collections:

| Collection | Purpose |
|---|---|
| `users` | All user accounts with role, department, student/employee ID |
| `collegeConfig` | Single document (`main`) with college-wide settings and working hours |
| `rooms` | Classrooms and labs with type and capacity |
| `faculty` | Faculty profiles with availability and workload constraints |
| `timetables` | Published timetables with schedule, course info, and status |

### Timetable Status Lifecycle

```
generated → published → archived
```

When a new timetable is published for a course-semester-section, any previously published version is automatically archived.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Firebase project with **Authentication** (Email/Password) and **Firestore** enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rajveer-upadhyay-502/SIH_2026.git
cd SIH_2026/smart-timetable

# 2. Install dependencies
npm install

# 3. Configure Firebase (see Environment Variables below)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in the `smart-timetable/` directory and add your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> These values are available in your Firebase project settings under **Project Settings → General → Your apps**.

---

## Available Scripts

Run these from inside the `smart-timetable/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## Firestore Security Rules (Recommended)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /collegeConfig/{doc} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /faculty/{facultyId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'coordinator'];
    }

    match /timetables/{timetableId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'coordinator';
    }
  }
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project was built for **Smart India Hackathon 2026**. All rights reserved.

---

<p align="center">Built with ❤️ for SIH 2026</p>
