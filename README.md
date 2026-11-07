# ICSI 418Y – Programming Assignment 4
## Project Management Application

A full-stack project management application built with React, Express.js, and MongoDB. The application supports user registration and login, project creation, project membership management, and user story management through project backlogs.

## Technologies Used

- **Frontend:** React and Vite
- **Backend:** Node.js and Express.js
- **Database:** MongoDB Atlas
- **Additional Packages:** MongoDB Node.js Driver, CORS, and dotenv

## Features

### User Management (PA2)

- Register new users.
- Log in with existing credentials.
- Prevent duplicate usernames.
- Retrieve registered users without returning passwords through the users API.

### Project Management (PA3)

- Create projects with a name, description, status, and Project Lead.
- View all projects and their details.
- Display each project's Project Lead.
- Support project statuses: Planning, Active, and Completed.

### Project Membership (PA3 and PA4)

- View members of a selected project.
- Automatically include the Project Lead as a project member.
- Add registered users to projects.
- Prevent duplicate memberships.
- Prevent removal of the Project Lead.
- Prevent removing members who still have assigned user stories, including completed stories.
- Require assigned stories to be reassigned, unassigned, or deleted before removing a member.
- Refresh the member list after membership changes.

### User Story Management (PA4)

- Create user stories associated with a selected project.
- Provide a title and description using the user story format:

  `As a [type of user], I want [goal], so that [benefit].`

- Set story priorities to High, Medium, or Low.
- Automatically assign newly created stories the status To Do.
- Assign stories to project members or leave them Unassigned.
- View all user stories belonging to a selected project's backlog.
- Display story title, description, priority, status, and assigned member.
- Edit existing stories, including their title, description, priority, status, and assigned member.
- Support story statuses: To Do, In Progress, and Done.
- Allow completed stories to be reopened by changing their status.
- Delete stories with a confirmation prompt.
- Prevent assigning users who are not members of the selected project.
- Keep each story associated with its original project.
- Refresh the backlog after creating, editing, or deleting stories.
- Store user stories in MongoDB so they persist after refreshing the application.

## Prerequisites

Install the following before running the application:

- Node.js and npm
- A MongoDB Atlas account and an accessible database cluster
- Git (if cloning the repository)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ponnamharshini/icsi418y-pa2.git
cd icsi418y-pa2
```

### 2. Configure the Backend

Open a terminal in the project root:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder with your MongoDB Atlas connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

Replace the placeholder with your actual MongoDB Atlas connection string.

Start the backend:

```bash
node server.js
```

The backend runs at:

`http://localhost:5000`

### 3. Configure the Frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

`http://localhost:5173`

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
| GET | `/api/projects/:id/members` | Retrieve project members |
| POST | `/api/projects/:id/members` | Add a project member |
| DELETE | `/api/projects/:id/members/:userId` | Remove a non-lead member, subject to assignment validation |
| POST | `/api/projects/:id/stories` | Create a user story |
| GET | `/api/projects/:id/stories` | Retrieve stories for a project |
| PUT | `/api/projects/:id/stories/:storyId` | Update a user story |
| DELETE | `/api/projects/:id/stories/:storyId` | Delete a user story |

## Database Collections

The application uses the `pa2` database and the following MongoDB collections:

- **users** – Stores registered user information, including first name, last name, username, and password.
- **Projects** – Stores project details, status, and Project Lead references.
- **ProjectMemberships** – Stores project and user membership references.
- **UserStories** – Stores user stories associated with projects.

Each UserStories document contains:

- `_id` – MongoDB ObjectId for the story.
- `project_id` – ObjectId referencing the associated project.
- `title` – User story title.
- `description` – User story description.
- `priority` – High, Medium, or Low.
- `status` – To Do, In Progress, or Done.
- `assigned_user_id` – ObjectId referencing an assigned project member, or null if unassigned.

## Testing Instructions

To test the application:

1. Register at least three users.
2. Create at least two projects.
3. Ensure each project has a Project Lead and at least one additional member.
4. Create at least five user stories across the two projects.
5. Include all three priority levels and all three story statuses.
6. Test both assigned and unassigned stories.
7. Verify that users can only be assigned to stories in projects where they are members.
8. Edit stories and change their priority, status, and assigned member.
9. Verify that completed stories can be reopened.
10. Test deleting stories using the confirmation prompt.
11. Attempt to remove a member who has assigned stories and verify that the application prevents removal.
12. Reassign, unassign, or delete the member's assigned stories before attempting removal again.
13. Refresh the application and verify that projects, memberships, and user stories persist.

## Running the Application

1. Start the backend and confirm that it connects to MongoDB.
2. Start the frontend in a separate terminal.
3. Open the Vite URL in your browser.
4. Sign up or log in.
5. Create projects and manage their memberships.
6. Open the Project Backlog to create, assign, edit, and delete user stories.

## Security and Repository Notes

- Keep `.env` private because it contains database connection credentials.
- Do not commit `node_modules`; dependencies can be installed using `npm install`.
- Do not commit database credentials or other sensitive information.
- The `.gitignore` file should exclude `.env` and `node_modules/`.

This project was developed for ICSI 418Y, Software Engineering, Programming Assignments 2, 3, and 4.