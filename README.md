# CivicConnect 🏛️📍
> **A Crowdsourced Geospatial Platform for Reporting, Prioritizing, and Tracking Civic Issues**  
> *Developed as a College Minor Project (Full Phase 1, Phase 2, and Phase 3 Implementation)*

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://reactjs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-green.svg)](https://www.mongodb.com/)
[![Leaflet Maps](https://img.shields.io/badge/Geospatial-Leaflet%20%2B%202dsphere-orange.svg)](https://leafletjs.com/)
[![Groq AI Vision](https://img.shields.io/badge/AI%20Vision-Groq%20qwen3.8--27b-purple.svg)](https://groq.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary%20CDN-brightgreen.svg)](https://cloudinary.com/)

---

## 📌 Project Overview
**CivicConnect** bridges the gap between citizens and municipal municipal authorities. Citizens can report infrastructure issues (such as potholes, broken streetlights, water main leaks, and blocked drainage) with photos and precise GPS coordinates. 

The platform leverages **Groq AI Vision** for defect validation, computes an explainable **4-factor priority score (0–100)**, guides municipal staff through a **strict 7-stage state machine**, provides citizens with transparent **end-to-end resolution tracking with photographic proof**, and computes real-time operational intelligence using **MongoDB Aggregation Pipelines**.

---

## 🏗️ Architecture & Core System Features

```
[ Citizen ] ──▶ Photo & GPS Report ──▶ [ Groq AI Vision ]
     │                                         │
     ▼                                         ▼
[ Priority Engine ] ◀── Community Votes ◀── [ Severity & Time ]
     │
     ▼
[ Admin Queue ] ──▶ State Machine Verification ──▶ [ Department Assignment ]
     │                                                     │
     ▼                                                     ▼
[ Geospatial 2dsphere ]                            [ Resolution Proof ]
     │                                                     │
     └─────────────▶ [ Real-time Analytics ] ◀─────────────┘
```

### 1. Strict 7-Stage State Machine Lifecycle
Issue status transitions are governed by an authoritative backend state machine (`statusTransitionService.js`), preventing illegal skipping:
- `Submitted` ➔ Initial citizen submission with photo and GPS.
- `Under Review` ➔ Evaluated by municipal command center.
- `Verified` ➔ Confirmed as genuine infrastructure defect.
- `Assigned` ➔ Allocated to a specific municipal department.
- `In Progress` ➔ Field crew dispatched and repair active on site.
- `Resolved` ➔ Closed with mandatory description and Cloudinary resolution photo.
- `Rejected` ➔ Flagged with administrative reason (e.g., duplicate, out of jurisdiction).

### 2. Rule-Based 4-Factor Priority Engine (0–100)
Every issue receives a dynamic, explainable priority score calculated directly in the backend (`priorityService.js`):
$$\text{Priority Score} = \text{Severity (0-30)} + \text{Confirmations (0-25)} + \text{AI Support (0-20)} + \text{Time Pending (0-25)}$$

- **Severity (0–30 pts):** `High` = 30 pts, `Medium` = 20 pts, `Low` = 10 pts.
- **Community Confirmations (0–25 pts):** Each neighbor confirmation adds +5 pts (capped at 25 pts). Self-confirmation is prevented.
- **AI Assistive Vision (0–20 pts):** Proportional Groq AI confidence score + category match verification.
- **Time Pending (0–25 pts):** Unresolved reports gain +2.5 pts per 24 hours pending (capped at 25 pts).

**Priority Tiers:**
- `0 - 24` ➔ **Low** (Green)
- `25 - 49` ➔ **Medium** (Amber)
- `50 - 74` ➔ **High** (Orange)
- `75 - 100` ➔ **Critical** (Red)

### 3. Municipal Department Allocation
Configured with municipal divisions (`departments.js`):
- `Road Maintenance`
- `Electrical`
- `Sanitation`
- `Drainage`
- `Water`
- `Public Facilities`
- `Other`

### 4. High-Performance MongoDB Geospatial Engine
- Employs a **`2dsphere` spatial index** on GeoJSON coordinates `[longitude, latitude]`.
- Native **`$geoNear` aggregation** calculates distances down to the meter and sorts issues by true spherical proximity within a configurable radius (50m to 50km).

### 5. Real-Time MongoDB Analytics Aggregations
All metrics are computed inside the database engine across 9 concurrent aggregation pipelines:
- **Summary KPIs:** Total, Pending, Active, Resolved, Critical.
- **Category & Severity Distributions:** Aggregated via `$group`, `$project`, and `$sort`.
- **Resolution Turnaround & SLA:** Average, fastest, and longest resolution times via `$subtract` on `resolvedAt` and `createdAt`.
- **Community Engagement Leaderboard:** Ranking top citizen-verified reports.
- **AI Inspection Accuracy:** Average vision confidence score and problem detection rates.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18 (Vite), React Router v6, Axios, Vanilla CSS (Glassmorphism & Responsive Grids) |
| **Geospatial & Maps** | Leaflet, React-Leaflet, OpenStreetMap, GeoJSON, MongoDB `2dsphere` |
| **Backend API** | Node.js, Express.js (RESTful Modular Architecture) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **AI Vision** | Groq SDK (`qwen/qwen3.8-27b` multimodal vision model) |
| **Cloud Storage** | Cloudinary CDN (Multer memory/disk stream) |
| **Security** | JWT (JSON Web Tokens), Bcrypt.js password hashing, RBAC (Citizen vs. Admin) |

---

## 🌐 Complete API Documentation

### Authentication (`/api/auth`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new Citizen account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |

### Public & Citizen Issues (`/api/issues`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/issues` | Citizen (JWT) | Submit issue with photo, category, severity, and coordinates |
| `GET` | `/api/issues/my` | Citizen (JWT) | Get issues reported by the logged-in citizen |
| `GET` | `/api/issues/map` | Public | Get coordinates and status for Leaflet map markers |
| `GET` | `/api/issues/nearby` | Public | Query nearby issues by `longitude`, `latitude`, `radius`, `category` |
| `GET` | `/api/issues/:id` | Public | Get single issue with full status audit history and resolution proof |
| `GET` | `/api/issues/:id/priority` | Public | Get live priority score and 4-factor breakdown |
| `PUT` | `/api/issues/:id/confirm` | Citizen (JWT) | Confirm/upvote an issue (+5 priority pts; self-upvote blocked) |

### Municipal Administration & Workflow (`/api/admin`)
*All admin routes require JWT Authentication and `admin` role.*
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/issues` | Filtered, searchable, sorted, and paginated issue queue |
| `GET` | `/api/admin/issues/:id` | Deep administrative inspection view for a single issue |
| `PATCH`| `/api/admin/issues/:id/status` | Update status with strict state machine validation |
| `PATCH`| `/api/admin/issues/:id/assign` | Assign verified issue to municipal department |
| `PATCH`| `/api/admin/issues/:id/in-progress` | Transition assigned issue to In Progress |
| `POST` | `/api/admin/issues/:id/resolve` | Resolve issue with mandatory work description & optional proof photo |
| `POST` | `/api/admin/issues/:id/duplicate` | Link and close issue as duplicate of existing issue ID |
| `GET` | `/api/admin/departments` | Get list of configured municipal departments |

### Analytics Dashboard (`/api/admin/analytics`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/analytics` | Consolidated single-roundtrip analytical dashboard payload |
| `GET` | `/api/admin/analytics/summary` | Overall KPI counters (Total, Pending, Resolved, Critical) |
| `GET` | `/api/admin/analytics/categories` | Issue volume breakdown across infrastructure categories |
| `GET` | `/api/admin/analytics/status` | Counts across all 7 state machine statuses |
| `GET` | `/api/admin/analytics/resolution` | Municipal turnaround performance (average, fastest, longest duration) |
| `GET` | `/api/admin/analytics/community` | Crowdsourced confirmation statistics and top confirmed issues |
| `GET` | `/api/admin/analytics/ai` | Groq AI vision inspection volume and confidence stats |

---

## 🚀 Setup & Local Execution Guide

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **MongoDB Atlas** database account
- **Cloudinary** account (for media storage)
- **Groq Cloud** API key (for AI vision)

### 2. Backend Configuration
1. Navigate to the `server` directory:
   ```bash
   cd server
   npm install
   ```
2. Create or verify `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=qwen/qwen3.8-27b
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration
1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   npm install
   ```
2. Create or verify `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The client will open at `http://localhost:5173`.

### 4. Admin Account & Realistic Demo Data
Run the included scripts from the `server` folder:
- **Create Admin User:**
  ```bash
  node scripts/createAdmin.js
  ```
  *Credentials: `admin@example.com` / `adminpassword123`*
- **Populate Realistic Municipal Demo Data (12 diverse issues across all categories & statuses):**
  ```bash
  node scripts/seedDemoData.js
  ```
- **Execute End-to-End Scenario Verification Test:**
  ```bash
  node scripts/testEndToEnd.js
  ```

---

## 🎓 College Minor Project Viva Voce Reference

### Q1: What makes CivicConnect different from a standard complaint portal?
**Answer:** Traditional portals act as static message boxes where complaints get lost without accountability. CivicConnect introduces:
1. **Explainable 4-Factor Prioritization:** Automatically bubbles high-urgency hazards (severity + AI confidence + community upvotes + wait time) to the top of the queue.
2. **Authoritative State Machine:** Prevents arbitrary status changes; issues must be inspected, assigned to departments, and resolved with tangible photographic proof.
3. **Geospatial Proximity Search:** Employs spherical indexing so citizens and field teams can instantly locate defects within meters of their current GPS location.
4. **Transparent Public Auditing:** Citizens see every timestamped action taken by authorities along with before/after photos.

### Q2: Why did you choose MongoDB Aggregation Pipelines instead of processing data in JavaScript?
**Answer:** Performing statistical aggregations (like averages, distributions, and date extractions) inside MongoDB Atlas using `$group`, `$project`, and `$subtract` is significantly faster and more scalable:
- **Zero Memory Exhaustion:** Node.js does not need to load thousands of documents into RAM.
- **Bandwidth Efficiency:** Only the calculated totals (a few bytes) travel across the network.
- **Hardware Optimization:** MongoDB processes calculations close to storage using pre-built C++ indexing algorithms.

### Q3: Why does GeoJSON mandate `[longitude, latitude]` instead of `[latitude, longitude]`?
**Answer:** GeoJSON adheres to standard Cartesian $(X, Y)$ coordinate geometry where the horizontal axis (East-West) is $X$ (Longitude) and the vertical axis (North-South) is $Y$ (Latitude). While conversational English says "Lat/Long", spatial database standards (OGC and GeoJSON RFC 7946) strictly mandate `[longitude, latitude]`.

### Q4: How is security and data privacy maintained on public views?
**Answer:** 
- Passwords are encrypted with `bcrypt` (10 salt rounds) and stripped from all database queries via Mongoose `select: false`.
- Endpoints return sanitized user projections (`name`, `email`, `role`).
- Authorization is checked on every administrative mutation using custom Express middleware (`protect` and `admin`).

---

## 👥 Contributors & Academic Credits
- **Project:** College Minor Project (Semester 7)
- **Institution:** Department of Computer Science & Engineering
- **Author:** Sonu Kumar Mandal (AJU)
- **Core Technology:** MERN Stack (MongoDB, Express, React, Node.js) with Groq Vision AI & Leaflet
