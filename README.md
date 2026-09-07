# Shortly

Shortly is a minimal, production-quality URL shortener service built with Node.js, Express, and MongoDB. It features high-speed redirects, robust input validation, rate limiting, security headers, and an understated, Unix-inspired web interface.

![Shortly Web Interface](docs/images/shortly-ui.png)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Engineering Highlights](#engineering-highlights)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Start MongoDB](#2-start-mongodb)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Run the Application](#4-run-the-application)
- [Web Interface](#web-interface)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
  - [Foundation Endpoints](#foundation-endpoints)
  - [URL Endpoints](#url-endpoints)
- [Security & Validation](#security--validation)
- [License](#license)

---

## Features

- **URL Shortening**: Generates unique, URL-safe 6-character Base62 identifiers with automated collision resolution.
- **Short-Code Generation**: Cryptographically secure random identifiers generated via native `crypto.randomInt`.
- **Fast HTTP 302 Redirects**: Rapid lookups via unique MongoDB indexes with atomic click incrementing.
- **Robust Input Validation**: Strict validation for absolute HTTP/HTTPS protocols and short-code format sanitization.
- **Rate Limiting**: Built-in rolling-window limiter restricting URL creation to 30 requests per minute per IP.
- **Security Headers**: Hardened with Helmet (Content Security Policy, X-Frame-Options, X-Content-Type-Options nosniff).
- **Client-Side QR Code Generation**: Generates and downloads high-resolution PNG QR codes for shortened URLs on demand without external tracking or server roundtrips.
- **Unix-Inspired Web Interface**: Minimalist, keyboard-first developer interface with zero frontend framework overhead.
- **Graceful Lifecycle Management**: Sequential DB-first startup and graceful shutdown hooks for SIGINT/SIGTERM.
- **Health & Telemetry**: `/health` endpoint reporting uptime, service metadata, and client-measured roundtrip latency.

## Tech Stack

- **Runtime**: Node.js (JavaScript, CommonJS)
- **Framework**: Express v5
- **Database / ODM**: MongoDB with Mongoose v9
- **Security & Headers**: Helmet
- **Configuration**: dotenv
- **Development Tooling**: nodemon
- **Frontend**: Vanilla HTML5, CSS3 (monospace design system), Vanilla JavaScript (fetch API)

## Engineering Highlights

- **Layered Architecture**: Strict separation of concerns with isolated routing, HTTP controllers, domain services, and Mongoose data models.
- **Cryptographically Secure Identifiers**: Uses Node.js native `crypto.randomInt` to generate 6-character Base62 codes (`[a-zA-Z0-9]`, ~56.8 billion permutations) without pseudo-random bias.
- **Collision Resolution**: Automatic retry loop (up to 5 attempts) catching MongoDB unique index violations (`E11000`) before returning responses.
- **Atomic Click Tracking**: Uses MongoDB's atomic `$inc` operator in `findOneAndUpdate` to prevent race conditions during concurrent redirects.
- **Defensive Input Validation**: Two-layer validation (controller boundary + Mongoose schema) verifying WHATWG URL specifications (HTTP/HTTPS only) and pre-database regex sanitization (`/^[a-zA-Z0-9_-]{3,30}$/`).
- **Rolling-Window Rate Limiting**: Lightweight in-memory rate limiter protecting creation endpoints at 30 req/min/IP with standard `RateLimit-*` and `Retry-After` headers.
- **Security-Hardened Defaults**: Integrated Helmet middleware setting Content Security Policy (`'self'`), MIME sniffing protection (`nosniff`), and frame restriction (`SAMEORIGIN`).
- **Safe Error Propagation**: Centralized Express error-handling middleware intercepting malformed JSON payloads and masking 500-level database internals in client responses.
- **Resilient Lifecycle Management**: Sequential DB-first startup ensuring MongoDB readiness before HTTP binding, with graceful shutdown handlers for `SIGINT` and `SIGTERM`.
- **Zero-Framework Web Client**: High-performance, accessible terminal-inspired interface built with vanilla HTML5, CSS3, and JavaScript with zero build steps or runtime framework bloat.

## Project Structure

```text
.
├── docs/
│   └── images/
│       └── shortly-ui.png   # Web interface preview
├── src/
│   ├── config/
│   │   └── db.js            # MongoDB connection and lifecycle handlers
│   ├── controllers/
│   │   └── urlController.js # Request handlers (validation, response shaping)
│   ├── middlewares/
│   │   └── rateLimiter.js   # Rolling-window in-memory rate limiter
│   ├── models/
│   │   └── Url.js           # Mongoose model, schema validation, and unique indexes
│   ├── public/
│   │   ├── vendor/
│   │   │   └── qrcode.js    # Lightweight client-side QR generator library
│   │   ├── app.js           # Frontend client application
│   │   ├── index.html       # Minimalist Unix-style markup
│   │   └── styles.css       # Monospace stylesheet
│   ├── routes/
│   │   ├── redirectRoutes.js# GET /:shortCode redirect router
│   │   └── urlRoutes.js     # POST /api/urls router
│   ├── services/
│   │   └── urlService.js    # Shortening business logic, collision retries, DB access
│   ├── utils/
│   │   └── generateShortCode.js # Cryptographic Base62 short-code generator
│   ├── app.js               # Express application assembly & error middleware
│   └── server.js            # Server entrypoint and graceful shutdown listeners
├── .env.example             # Example environment variable configuration
├── .gitignore               # Git ignore rules (dependencies, secrets, logs)
├── package.json             # NPM package manifest and scripts
├── package-lock.json        # NPM dependency lockfile
└── README.md                # Project documentation
```

## Prerequisites

Shortly is cross-platform and fully supported on **Linux**, **macOS**, and **Windows**:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MongoDB](https://www.mongodb.com/) (v6 or higher; local Community Edition or MongoDB Atlas)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/bluespecks/urlShortner.git
cd urlShortner
npm install
```

### 2. Start MongoDB

Shortly requires a running MongoDB database. Choose the setup option for your operating system:

#### Linux
- **Systemd Service:**
  ```bash
  sudo systemctl start mongod
  sudo systemctl status mongod
  ```
- **Standalone Binary:**
  ```bash
  mkdir -p /tmp/mongodb/data
  mongod --dbpath /tmp/mongodb/data --port 27017
  ```

#### macOS
- **Homebrew Service:**
  ```bash
  brew services start mongodb-community
  ```
- **Standalone Binary:**
  ```bash
  mkdir -p /usr/local/var/mongodb
  mongod --dbpath /usr/local/var/mongodb --port 27017
  ```

#### Windows
- **MongoDB Community Windows Service** (installed with MongoDB MSI installer):
  - In Command Prompt (Run as Administrator):
    ```cmd
    net start MongoDB
    ```
  - In PowerShell (Run as Administrator):
    ```powershell
    Start-Service MongoDB
    ```
- **Standalone Binary** (Command Prompt or PowerShell):
  ```cmd
  "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
  ```
  *(Ensure `C:\data\db` exists or adjust the path to your MongoDB installation directory).*

#### Cloud Alternative (All Platforms)
If you prefer not to run MongoDB locally, create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database) and provide your Atlas connection URI in `.env`.

### 3. Configure Environment Variables

Create your local `.env` file from `.env.example`:

**Linux / macOS:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

Configure your environment settings in `.env`. The default settings below work out-of-the-box on Linux, macOS, and Windows with a default local MongoDB installation:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/shortly
BASE_URL=http://localhost:3000
```

### 4. Run the Application

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

- Start the application and navigate to `http://localhost:3000` in any web browser.
- Enter any valid HTTP or HTTPS URL and press `Enter` or click `[ ↵ shorten ]`.
- Copy the resulting short link with `[ copy ]` (provides visual `> copied` feedback) or test it directly with `[ open ↗ ]`.
- Generate a QR code containing the short URL on demand with `[ generate qr ]`, and download it directly as a high-resolution PNG (`shortly-<shortCode>-qr.png`) via `[ download qr ]`.
- Live latency and API connectivity are continuously checked via `/health`.

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Starts server in watch mode with automatic restart on file changes |
| `npm start` | `node src/server.js` | Starts server in standard production mode |

## API Reference

### Foundation Endpoints

- **`GET /`**
  - Web browser requests (`Accept: text/html`): Delivers the web interface.
  - API client requests (`Accept: application/json` or curl): Returns service metadata.

  **API Response (HTTP 200):**
  ```json
  {
    "name": "Shortly API",
    "version": "1.0.0",
    "description": "Production-quality URL shortener service"
  }
  ```

- **`GET /health`**
  Health check endpoint reporting service availability.

  **Response (HTTP 200):**
  ```json
  {
    "status": "ok",
    "service": "Shortly",
    "timestamp": "2026-09-06T00:00:00.000Z"
  }
  ```

### URL Endpoints

- **`POST /api/urls`**
  Creates a shortened URL. Rate-limited to 30 requests per minute per IP.

  **Headers:**
  - `Content-Type: application/json`

  **Request Body:**
  ```json
  {
    "originalUrl": "https://example.com/some/long/path?query=param"
  }
  ```

  **Response (HTTP 201 Created):**
  ```json
  {
    "originalUrl": "https://example.com/some/long/path?query=param",
    "shortCode": "abc123",
    "shortUrl": "http://localhost:3000/abc123"
  }
  ```

- **`GET /:shortCode`**
  Redirects to the stored original URL.

  **Response:**
  - `HTTP 302 Found` with `Location: <originalUrl>` on success
  - `HTTP 404 Not Found` JSON if shortCode is non-existent:
    ```json
    {
      "error": "NotFound",
      "message": "Short URL not found"
    }
    ```
  - `HTTP 400 Bad Request` JSON if shortCode format is invalid:
    ```json
    {
      "error": "BadRequest",
      "message": "Invalid short code format"
    }
    ```

## Security & Validation

- **URL Protocol Validation**: Strictly accepts only absolute URLs starting with `http://` or `https://`. Rejects `ftp://`, `javascript:`, `data:`, relative paths, or non-string inputs.
- **Short-Code Sanitization**: Format regex (`/^[a-zA-Z0-9_-]{3,30}$/`) ensures malicious path traversals or database operator injections are rejected with HTTP 400 before reaching MongoDB.
- **Security Headers**: Integrated Helmet middleware setting CSP, `nosniff`, `SAMEORIGIN`, and strict transport rules.
- **Rate Limiting**: Rolling-window limiter returns HTTP 429 with `Retry-After` and `RateLimit-*` headers without restricting redirects or health probes.
- **Sanitized Errors**: Internal server errors return clean 500 JSON without exposing stack traces or database connection strings.

## License
 
This project is licensed under the [ISC License](package.json).
