# MERN Stack Todo Application

A full-featured todo application built with the MERN stack (MongoDB, Express, React, Node.js) with TypeScript implementation.

## Features

### Frontend (React.js + TypeScript)
- Users can add, delete, update, and search tasks
- Each task has a title, status (done/not done), and priority (Low/Medium/High)
- Tasks are sortable by priority or status
- Users can create recurring tasks (daily, weekly, monthly)
- Users can define dependencies between tasks (e.g., Task A cannot be completed before Task B)
- Responsive design for mobile and desktop devices

### Backend (Node.js + Express + TypeScript)
- REST API supporting all frontend features
- Adding, deleting, updating tasks
- Searching and filtering tasks by status, priority
- Handling recurring tasks logic (auto-creation at scheduled intervals)
- Enforcing task dependencies (e.g., Task A must be completed before Task B)
- User authentication and authorization
- Admin dashboard for user management

## Project Structure

The application is divided into two main folders:
- `client`: Frontend React application with TypeScript
- `server`: Backend Express/Node.js application with TypeScript

## Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- MongoDB (local installation or MongoDB Atlas account)
- TypeScript

## Installation and Setup

### Server Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory based on the `.env.sample` file:
   ```
   # Copy the sample env file
   cp .env.sample .env
   ```

4. Update the `.env` file with your MongoDB connection string and other required variables:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/todo-app
   JWT_SECRET=your_jwt_secret_key
   # Other environment variables as specified in .env.sample
   ```

### Client Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the client directory based on the `.env.sample` file:
   ```
   # Copy the sample env file
   cp .env.sample .env
   ```

4. Update the `.env` file with the necessary variables:
   ```
   REACT_APP_API_URL=http://localhost:3000/api
   # Other environment variables as specified in .env.sample
   ```

## Running the Application

### Start the Backend Server

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Start the server:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

### Start the Frontend Application

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Start the React application:
   ```
   npm start
   ```

## Accessing the Application

- Frontend: Open your browser and navigate to `http://localhost:3001`
- Backend API: Available at `http://localhost:3000/api`

## API Endpoints

### Task Management
- `GET /tasks` - Get all tasks (requires authentication)
- `GET /tasks/:id` - Get a specific task by ID (requires authentication)
- `POST /tasks` - Create a new task (requires authentication and validation)
- `PATCH /tasks/:id` - Update a task (requires authentication and validation)
- `DELETE /tasks/:id` - Delete a task (requires authentication)

### User Authentication
- `POST /users/register` - Register a new user (requires validation)
- `POST /users/login` - Login a user (requires validation)
