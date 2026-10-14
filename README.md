# ICSI 418Y – Programming Assignment 3
## Project Management Application

A full-stack web application built with React, Express.js, and MongoDB. The application supports user signup and login, project creation and listing, and project membership management.

## Technologies Used

- **Frontend:** React and Vite
- **Backend:** Node.js and Express.js
- **Database:** MongoDB Atlas
- **Additional packages:** MongoDB Node.js driver, CORS, and dotenv

## Features

### User Management
- Register new users.
- Log in with existing credentials.
- Prevent duplicate usernames.
- Retrieve registered users without returning passwords through the users API.

### Project Management
- Create projects with a name, description, status, and Project Lead.
- View all projects and their details.
- Display each project's lead.

### Project Membership
- View the members of a selected project.
- Automatically include the Project Lead as a project member.
- Add registered users to projects.
- Prevent duplicate memberships.
- Remove regular members while protecting the Project Lead from removal.
- Refresh the member list after membership changes.

## Prerequisites

Install the following before running the application:

- Node.js and npm
- A MongoDB Atlas account and an accessible database cluster
- Git (if cloning the repository)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/ponnamharshini/icsi418y-pa2.git
cd icsi418y-pa2
```

### 2. Configure the backend

Open a terminal in the project root:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder with your MongoDB Atlas connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

Replace the placeholder with your actual connection string. Never commit or share your `.env` file.

Start the backend:

```bash
node server.js
```

The backend runs at `http://localhost:5000`.

### 3. Configure the frontend

Open a second terminal in the project root and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Keep both terminals running while using the application.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check backend availability |
| POST | `/api/signup` | Register a user |
| POST | `/api/login` | Log in a user |
| GET | `/api/users` | Retrieve registered users |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects` | Retrieve all projects |
| GET | `/api/projects/:id/members` | Retrieve a project's members |
| POST | `/api/projects/:id/members` | Add a member |
| DELETE | `/api/projects/:id/members/:userId` | Remove a non-lead member |

## Database Collections

The application uses the `pa2` database and these collections:

- `users` – registered user information
- `Projects` – project details and Project Lead references
- `ProjectMemberships` – project and user membership references

## Running the Application

1. Start the backend and confirm it connects to MongoDB.
2. Start the frontend in a separate terminal.
3. Open the Vite URL in your browser.
4. Sign up or log in.
5. Create projects and manage their memberships.

## Security and Repository Notes

- Keep `.env` private because it contains database connection credentials.
- Do not commit `node_modules`; dependencies can be installed with `npm install`.
- Do not commit database credentials or other secrets.

This project was developed for ICSI 418Y, Programming Assignment 3.