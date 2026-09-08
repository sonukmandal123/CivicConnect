# CivicConnect

CivicConnect is a modern web platform where citizens can report civic problems such as potholes, broken streetlights, and water leakage. 

This repository contains the **Phase 2** implementation of the project, introducing advanced features like an interactive map, community upvoting, and AI-powered image analysis to verify reports.

## Features Implemented
- **Citizen Accounts**: Secure registration and login using JWT authentication and bcrypt password hashing.
- **Civic Issue Reporting**: Citizens can submit detailed reports including category, severity, description, and an image.
- **Cloudinary Integration**: Images are securely uploaded to Cloudinary instead of being stored on the server.
- **Interactive Public Map**: View all reported civic issues visually on an interactive map powered by Leaflet and OpenStreetMap.
- **Community Confirmations**: Users can upvote and confirm issues reported by others to crowd-source validation and help authorities prioritize.
- **AI-Powered Image Analysis**: Integrated with the Groq API to automatically analyze user-submitted images, detect if a civic problem is visible, and flag discrepancies between the user's claim and the AI's findings.
- **Citizen Dashboard**: A private dashboard where citizens can track the status of all the issues they have reported.
- **Admin Control Panel**: A restricted dashboard where administrators can view all reports across the platform and update their status (e.g., from "Submitted" to "Resolved").

## Tech Stack
- **Frontend**: React (Vite), React Router, Axios, CSS, React-Leaflet.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas, Mongoose.
- **Authentication**: JSON Web Tokens (JWT).
- **File Uploads**: Multer, Cloudinary.
- **AI Integration**: Groq API.

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
   - `GROQ_API_KEY=<Your Groq API Key>`
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
