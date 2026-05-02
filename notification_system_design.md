# Campus Notification Microservice

**Author:** Muvva Sriram Sai  
**Roll No:** AP23110010762  
**Email:** sriramsai_muvva@srmap.edu.in  
**Repository:** [github.com/Rams2006sing/AP23110010762](https://github.com/Rams2006sing/AP23110010762)

---

## 1. Project Overview

This project implements a **Campus Notification Microservice** — a full-stack web application that fetches, prioritizes, filters, and displays campus notifications (Placements, Results, Events) from a remote evaluation-service API. The application is built using **Next.js (App Router)** with **React** and **Material UI** on the frontend, and uses server-side API routes and server actions for secure backend operations.

The system is designed around a microservice architecture with clear separation of concerns:
- **Frontend Dashboard** — A responsive, interactive UI for viewing and filtering notifications.
- **Server-Side API Proxy** — A Next.js API route that securely proxies requests to the external evaluation-service, handling authentication and token management.
- **Logging Middleware** — A server-side logging module that sends structured log entries to a centralized logging service.
- **Priority Logic Engine** — A client-side utility that sorts and ranks notifications by type-weighted priority and recency.

---

## 2. Architecture & System Design

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              NotificationDashboard (page.js)          │  │
│  │  - React State Management (useState, useEffect)       │  │
│  │  - Tab Navigation (All / Priority Inbox)              │  │
│  │  - Type Filtering (Placement / Result / Event)        │  │
│  │  - MUI Component Rendering                           │  │
│  └──────────┬──────────────────────────┬─────────────────┘  │
│             │                          │                     │
│    Fetches via Axios            Calls Server Action          │
│    GET /api/notifications       sendLogToServer()            │
│             │                          │                     │
└─────────────┼──────────────────────────┼─────────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│   Next.js API Route     │  │   Logging Middleware          │
│   (Server-Side Proxy)   │  │   (Server Action)             │
│                         │  │                                │
│  /api/notifications/    │  │  logging_middleware/index.js   │
│  route.js               │  │  - Auto token refresh          │
│  - Auto token refresh   │  │  - POST to /evaluation-        │
│  - GET from evaluation- │  │    service/logs                │
│    service/notifications│  │  - Structured log format       │
│  - 401 retry logic      │  │    (stack, level, package,     │
│  - Token caching (60s   │  │     message, timestamp)        │
│    buffer)              │  │                                │
└────────────┬────────────┘  └──────────────┬─────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              External Evaluation Service API                 │
│              http://20.207.122.201/evaluation-service         │
│                                                              │
│  POST /auth              — Obtain JWT access token           │
│  GET  /notifications     — Fetch campus notifications        │
│  POST /logs              — Submit structured log entries      │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **User opens the dashboard** → `page.js` mounts and calls `loadNotifications()`.
2. **`getPriorityNotifications(50)`** is invoked from `utils/priorityLogic.js`.
3. The utility calls **`GET /api/notifications`** — our own Next.js API route (not the external API directly).
4. The **API route** (`app/api/notifications/route.js`) checks if a valid JWT token is cached:
   - If valid → uses cached token.
   - If expired or missing → calls `POST /evaluation-service/auth` with credentials to get a fresh token.
5. The API route fetches notifications from `GET /evaluation-service/notifications` using the valid token.
6. Response is returned to the client, where **priority sorting** is applied:
   - **Primary sort:** Notification type weight (Placement=3 > Result=2 > Event=1).
   - **Secondary sort:** Recency (newer notifications first).
7. The sorted notifications are rendered in the MUI dashboard.
8. **Logging:** On each user action (page load, tab switch), a server action sends a structured log entry to the evaluation-service logging endpoint.

---

## 3. Project Structure

```
AP23110010762/
├── .gitignore                          # Git ignore rules (node_modules, .next, .DS_Store)
├── notification_system_design.md       # This documentation file
├── package-lock.json                   # Root lockfile
├── server.js                           # (Reserved for future backend use)
│
├── notification_app_be/                # Backend directory (reserved for future microservices)
│
└── notification_app_fe/                # Frontend application (Next.js)
    ├── package.json                    # Dependencies and scripts
    ├── package-lock.json               # Dependency lockfile
    │
    ├── app/                            # Next.js App Router directory
    │   ├── layout.js                   # Root layout — HTML shell, metadata
    │   ├── page.js                     # Main dashboard component (client-side)
    │   └── api/
    │       └── notifications/
    │           └── route.js            # Server-side API proxy with auto token refresh
    │
    ├── utils/
    │   └── priorityLogic.js            # Priority sorting algorithm (weight + recency)
    │
    └── logging_middleware/
        └── index.js                    # Server action for centralized logging
```

---

## 4. Stage-by-Stage Implementation

### Stage 1: Priority Notification Logic (`utils/priorityLogic.js`)

**Objective:** Fetch notifications from the evaluation-service API and sort them by a custom priority algorithm.

**Implementation Details:**

- **Weighted Priority System:** Each notification type is assigned a weight:
  | Type | Weight | Rationale |
  |------|--------|-----------|
  | Placement | 3 | Highest priority — time-sensitive job/internship opportunities |
  | Result | 2 | Medium priority — academic results |
  | Event | 1 | Lowest priority — general campus events |

- **Sorting Algorithm:** A two-level comparator:
  1. **Primary:** Higher weight types appear first.
  2. **Secondary:** Within the same type, newer notifications (by timestamp) appear first.

- **Configurable Limit:** The function accepts a parameter `n` (default: 10) to control how many notifications to return. The dashboard calls it with `n=50` for the "All" view.

```javascript
// Sorting logic: Weight first, then Recency
const sortedNotifications = notifications.sort((a, b) => {
    const weightA = WEIGHTS[a.Type] || 0;
    const weightB = WEIGHTS[b.Type] || 0;
    if (weightA !== weightB) return weightB - weightA;
    return new Date(b.Timestamp) - new Date(a.Timestamp);
});
```

### Stage 2: Frontend Dashboard (`app/page.js`)

**Objective:** Build an interactive UI to display, filter, and navigate notifications.

**Implementation Details:**

- **Framework:** Next.js 16 with App Router and React (client component via `'use client'`).
- **UI Library:** Material UI (MUI) v6 for a polished, accessible component set.
- **Features:**
  - **Tab Navigation:**
    - *All Notifications* — Displays all fetched notifications (up to 50).
    - *Priority Inbox (Top 10)* — Shows only the top 10 highest-priority notifications.
  - **Type Filtering:** Dropdown to filter by notification type (All / Placements / Results / Events).
  - **Visual Indicators:** Color-coded `Chip` components differentiate Placement (primary/blue) from other types (secondary/purple).
  - **Timestamps:** Each notification displays a human-readable localized date/time.
  - **Empty State:** Shows a friendly message when no notifications match the filter.

- **State Management:**
  | State Variable | Purpose |
  |----------------|---------|
  | `notifications` | Full array of fetched & sorted notifications |
  | `tabValue` | Current active tab (0=All, 1=Priority) |
  | `filterType` | Currently selected type filter |

### Stage 3: Logging Middleware (`logging_middleware/index.js`)

**Objective:** Implement centralized, structured logging that sends log entries to the evaluation-service.

**Implementation Details:**

- **Server Action:** Marked with `'use server'` directive — executes server-side only, keeping credentials secure.
- **Structured Log Format:** Each log entry contains:
  ```json
  {
    "stack": "frontend",
    "level": "info|error|warn",
    "package": "page|ui|api|logic",
    "message": "Human-readable log message",
    "timestamp": "2026-05-02T12:00:00.000Z"
  }
  ```
- **Auto Token Refresh:** The middleware manages its own JWT token lifecycle with a 60-second pre-expiry buffer.
- **Non-Blocking:** Log failures are caught and logged to console — they never crash the main application.
- **Usage Points:**
  - Dashboard initialization (`"Dashboard initialized and data loaded"`)
  - Tab switches (`"Switched to All/Priority view"`)

### Stage 4: Server-Side API Proxy (`app/api/notifications/route.js`)

**Objective:** Create a secure server-side proxy to handle external API communication, avoiding CORS issues and keeping credentials off the client.

**Implementation Details:**

- **Why a Proxy?** The external evaluation-service API at `http://20.207.122.201` doesn't set CORS headers. Browser-side `fetch`/`axios` calls would be blocked. By routing through our own Next.js API route, the server makes the request (no CORS) and returns data to the client.

- **Automatic Token Management:**
  - **Token Caching:** Access tokens are cached in-memory with expiry tracking.
  - **Pre-emptive Refresh:** Tokens are refreshed 60 seconds before expiry to avoid mid-request failures.
  - **Retry Logic:** If a 401 (Unauthorized) response is received, the cached token is invalidated and a fresh token is obtained for an automatic retry.

- **Authentication Flow:**
  ```
  Client GET /api/notifications
        │
        ▼
  Is cached token valid?
  ├── YES → Use cached token
  └── NO  → POST /evaluation-service/auth
             with clientID + clientSecret
             → Cache new token + expiry
        │
        ▼
  GET /evaluation-service/notifications
  with Authorization: Bearer <token>
        │
        ├── 200 OK → Return data to client
        └── 401    → Clear cache → Retry with fresh token
  ```

---

## 5. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | JavaScript (ES Modules) | ES2020+ |
| UI Library | Material UI (MUI) | 6.x |
| Styling Engine | Emotion | 11.x |
| HTTP Client | Axios | 1.6.x |
| Runtime | React | Latest |
| Package Manager | npm | — |
| Bundler | Turbopack (Next.js built-in) | — |

---

## 6. API Endpoints Used

### External Evaluation Service (`http://20.207.122.201/evaluation-service`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth` | Obtain a JWT access token (15-min expiry) | No (uses clientID/secret) |
| `GET` | `/notifications` | Fetch all campus notifications | Yes (Bearer token) |
| `POST` | `/logs` | Submit a structured log entry | Yes (Bearer token) |

### Internal Next.js API Route

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Proxy to external notifications API with auto-auth |

---

## 7. Key Design Decisions

### 7.1 Server-Side Proxy Pattern
Instead of calling the external API directly from the browser (which would expose credentials and be blocked by CORS), all external API calls are routed through Next.js API routes. This provides:
- **Security:** API keys and client secrets never reach the browser.
- **CORS Avoidance:** Server-to-server HTTP requests have no CORS restrictions.
- **Token Encapsulation:** The token lifecycle is fully managed server-side.

### 7.2 Automatic Token Refresh
The JWT tokens issued by the evaluation-service expire every 15 minutes (`iat` to `exp` = 900 seconds). Rather than hardcoding tokens (which would break after 15 minutes), the application:
- Caches tokens in memory.
- Checks expiry before each request with a 60-second safety buffer.
- Automatically fetches fresh tokens when needed.
- Retries failed requests on 401 responses.

### 7.3 Server Actions for Logging
The logging middleware uses Next.js `'use server'` directive, meaning it runs exclusively on the server. This ensures:
- Credentials are never exposed to the client.
- Log submissions happen server-side without CORS issues.
- The main UI thread is not blocked by log network requests.

### 7.4 Client-Side Priority Sorting
Sorting is performed on the client after data is fetched, rather than requesting sorted data from the API. This allows:
- Flexible re-sorting without additional API calls.
- Custom weight assignments per notification type.
- Instant UI updates when switching between All and Priority views.

---

## 8. How to Run

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Rams2006sing/AP23110010762.git

# Navigate to the frontend directory
cd AP23110010762/notification_app_fe

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at **http://localhost:3000**.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 9. Features Summary

| Feature | Description |
|---------|-------------|
| 📋 **Notification Dashboard** | Displays campus notifications in a clean, organized list |
| 🏷️ **Type Filtering** | Filter by Placement, Result, or Event categories |
| ⭐ **Priority Inbox** | Top 10 most important notifications based on weighted algorithm |
| 🔄 **Auto Token Refresh** | JWT tokens are automatically refreshed before expiry |
| 🔒 **Secure API Proxy** | All external API calls routed through server-side proxy |
| 📝 **Centralized Logging** | Structured log entries sent to evaluation-service |
| 🎨 **Material UI Design** | Clean, responsive interface with MUI components |
| ⏱️ **Real-time Timestamps** | Human-readable, localized date/time display |
| 🛡️ **Error Resilience** | Graceful error handling — log/API failures never crash the app |
| 🔃 **401 Retry Logic** | Automatic retry with fresh token on authentication failures |

---

## 10. Notification Data Model

Each notification object returned by the API has the following structure:

```json
{
  "ID": "unique-notification-id",
  "Type": "Placement | Result | Event",
  "Message": "PayPal Holdings Inc. hiring",
  "Timestamp": "2026-05-02T04:15:33Z"
}
```

---

## 11. Future Enhancements

- **Real-time Updates:** WebSocket or Server-Sent Events for live notification streaming.
- **Backend Microservice (`notification_app_be`):** Dedicated backend with database persistence, notification CRUD, and user preferences.
- **Push Notifications:** Browser push notifications for high-priority alerts.
- **User Authentication:** Role-based access (students, faculty, admin) with personalized notification feeds.
- **Notification Read Status:** Track which notifications have been read/dismissed.
- **Search Functionality:** Full-text search across notification messages.
- **Pagination:** Infinite scroll or paginated loading for large notification volumes.
