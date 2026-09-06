# Shortly 🔗

Shortly is a production-quality URL shortener backend service built with Node.js, Express, and MongoDB.

## Table of Contents

- [Features (Foundation)](#features-foundation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Run the Application](#3-run-the-application)
- [Available Scripts](#available-scripts)
- [Endpoints](#endpoints)
- [Guidelines](#guidelines)

---

## Features (Foundation)

- **Express Application Architecture**: Clean separation between application configuration (`src/app.js`) and HTTP server lifecycle (`src/server.js`).
- **Database Connection Management**: Robust MongoDB connection management via Mongoose with graceful disconnects.
- **Centralized Error Handling**: Standardized 404 and global error handling middleware.
- **Graceful Shutdown**: Listens to `SIGINT` and `SIGTERM` to close HTTP listeners and database connections cleanly.
- **Development Workflow**: Hot-reloading configured using `nodemon`.

## Tech Stack

- **Runtime**: Node.js (JavaScript, CommonJS)
- **Framework**: Express
- **Database / ODM**: MongoDB with Mongoose
- **Configuration**: dotenv
- **Development Tooling**: nodemon

## Project Structure

```text
.
├── src/
│   ├── config/
│   │   └── db.js            # MongoDB connection and lifecycle handlers
│   ├── controllers/
│   │   └── urlController.js # URL route handlers
│   ├── models/
│   │   └── Url.js           # Mongoose model and schema validation
│   ├── public/
│   │   ├── app.js           # Frontend client application
│   │   ├── index.html       # Web UI markup
│   │   └── styles.css       # Unix-inspired stylesheet
│   ├── routes/
│   │   ├── redirectRoutes.js# Root redirect handler
│   │   └── urlRoutes.js     # /api/urls router
│   ├── services/
│   │   └── urlService.js    # URL business logic and collision handling
│   ├── utils/
│   │   └── generateShortCode.js # Short code generation utility
│   ├── app.js               # Express app, middleware, and route configuration
│   └── server.js            # Server entrypoint and graceful shutdown listeners
├── .env.example             # Example environment variable configuration
├── .gitignore               # Ignored files for git (dependencies, secrets, logs)
├── AGENTS.md                # Development guidelines and Conventional Commit conventions
├── package.json             # NPM package manifest and scripts
└── README.md                # Project documentation
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas URI)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/bluespecks/urlShortner.git
cd urlShortner
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shortly
BASE_URL=http://localhost:3000
```

> **Note**: If `MONGODB_URI` is omitted during initial foundation testing, the server will log a warning and continue running the HTTP service.

### 3. Run the Application

#### Development Mode (with hot-reload via nodemon):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

## Web Interface

Shortly includes a minimalist, Unix-inspired web interface:

- Start the server (`npm run dev` or `npm start`).
- Open `http://localhost:3000` in your web browser.
- The interface communicates directly with `POST /api/urls` to shorten URLs, displays interactive copy/open controls, and queries `GET /health` to display live latency and service status.

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Starts server in watch mode with automatic restart on file changes |
| `npm start` | `node src/server.js` | Starts server in standard production mode |

## Endpoints

### Foundation Endpoints

- **`GET /`**
  Returns service metadata and available links.

  **Response:**
  ```json
  {
    "name": "Shortly API",
    "version": "1.0.0",
    "description": "Production-quality URL shortener service",
    "health": "/health"
  }
  ```

- **`GET /health`**
  Health check endpoint to verify that the server is operational.

  **Response:**
  ```json
  {
    "status": "ok",
    "service": "Shortly",
    "timestamp": "2026-09-06T00:00:00.000Z"
  }
  ```

### URL Endpoints

- **`POST /api/urls`**
  Creates a shortened URL.

  **Headers:**
  - `Content-Type: application/json`

  **Request Body:**
  ```json
  {
    "originalUrl": "https://example.com/some/long/url"
  }
  ```

  **Response (HTTP 201):**
  ```json
  {
    "originalUrl": "https://example.com/some/long/url",
    "shortCode": "abc123",
    "shortUrl": "http://localhost:3000/abc123"
  }
  ```

- **`GET /:shortCode`**
  Redirects to the original URL associated with the short code and increments its click counter.

  **Response:**
  - `HTTP 302 Found` with `Location: <originalUrl>` on success
  - `HTTP 404 Not Found` JSON if the short code does not exist:
    ```json
    {
      "error": "NotFound",
      "message": "Short URL not found"
    }
    ```

## Guidelines

Before contributing or creating pull requests, please read [AGENTS.md](AGENTS.md) for architectural guidelines and Conventional Commit conventions.
