# CivicConnect - Phase 1

CivicConnect is a web platform where citizens can report civic problems such as potholes, broken streetlights, and water leakage. 

This repository contains the **Phase 1** implementation of the project, focusing on core authentication and issue reporting features using the MERN stack (MongoDB, Express, React, Node.js).

## Features Implemented
- **Citizen Accounts**: Users can securely register and log in using JWT authentication and bcrypt password hashing.
- **Civic Issue Reporting**: Logged-in citizens can submit reports containing a title, description, category, severity, and an image.
- **Cloudinary Integration**: Images are securely uploaded to Cloudinary instead of being stored on the server.
- **Citizen Dashboard**: A private dashboard where citizens can track the status of all the issues they have reported.
- **Admin Control Panel**: A restricted dashboard where administrators can view all reports across the platform and update their status (e.g., from "Submitted" to "Resolved").

## Tech Stack
- **Frontend**: React (Vite), React Router, Axios, CSS.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas, Mongoose.
- **Authentication**: JSON Web Tokens (JWT).
- **File Uploads**: Multer, Cloudinary.

## How to Run Locally

### 1. Backend Setup
1. Open a terminal and navigate to the `server` folder: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `server` folder (use `.env.example` as a template) and add your credentials:
   - `PORT=5000`
   - `MONGO_URI=<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET=<Your Secret Key>`
   - `CLOUDINARY_CLOUD_NAME=<Your Cloudinary Name>`
   - `CLOUDINARY_API_KEY=<Your Cloudinary API Key>`
   - `CLOUDINARY_API_SECRET=<Your Cloudinary API Secret>`
4. Start the backend server: `npm run dev`

### 2. Frontend Setup
1. Open a new terminal and navigate to the `client` folder: `cd client`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `client` folder with the following:
   - `VITE_API_URL=http://localhost:5000/api`
4. Start the React development server: `npm run dev`

### 3. Creating an Admin Account
To access the Admin Control Panel, run the following script from the `server` folder:
```bash
node scripts/createAdmin.js
```
This will generate an admin account with the email `admin@example.com` and password `adminpassword123`.

---
*Built as a college minor project.*
