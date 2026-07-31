# 🚀 Partner Ingestion Console

> **A production-ready Partner Ingestion Console that simulates the internal tooling used by Partner Engineers to ingest media partner XML feeds, validate them against a real schema, track onboarding progress, and surface analytics that help operations teams identify the most common validation failures.**

---

## 🌐 Live Demo

### 👉 **Click here to view the live deployed project**

**Frontend (Vercel) + Backend (Render)**

🔗 **https://partner-console-app.vercel.app/**

> Click **"Try a clean sample"** button or **"Try a broken sample"** button to explore the application.

---

## 📸 Project Preview

Dashboard
```text
(Add Dashboard Screenshot)
```

XML Feed Validation
```text
(Add Validation Screenshot)
```

Validation Results & Errors
```text
(Add Results Screenshot)
```

Analytics Dashboard
```text
(Add Analytics Screenshot)
```

Partner Pipeline & Activity Feed
```text
(Add Pipeline Screenshot)
```

---

## ✨ Features

### 📺 Partner Feed Validation

- Validate real XML feeds against a declarative rule set
- Required field validation
- ISO-8601 date validation
- Enum validation
- URL format validation
- Integer coercion with warning support
- Upload custom XML feeds
- Includes clean and broken sample feeds

### 📊 Analytics & Reporting

- Persist every validation run to SQLite
- Track validation history
- SQL-powered "Top Failing Fields" analytics
- Real-time charts using Recharts
- Live activity ticker

### 🔄 Partner Onboarding Pipeline

- Track partner onboarding stages
- Submitted → Validating → QA Review → Live
- Log pipeline events automatically
- Monitor onboarding progress in real time

### 🌐 Feed Verification

- Optional live URL reachability checks
- Stream URL validation
- Closed Caption URL validation
- Timeout handling using Node's native fetch

### 📱 Responsive UI

- Clean dashboard interface
- Interactive charts
- Responsive layout
- Modern React-based user experience

---

## 🛠 Tech Stack

### Frontend

- React
- Vite
- Recharts

### Backend

- Node.js
- Express.js

### Database

- SQLite
- better-sqlite3

### XML Processing

- fast-xml-parser

### Deployment

- **Frontend:** Vercel
- **Backend:** Render

---

## 💡 Why This Project Exists

Partner-facing engineering roles require the ability to ingest external partner data, validate it reliably, analyze recurring issues, and manage operational workflows.

This project demonstrates those skills by:

- Parsing and validating real XML feeds
- Persisting validation history in SQLite
- Using SQL to identify the most common validation failures
- Managing partners through a real onboarding pipeline
- Providing analytics and operational visibility through an interactive dashboard

Built while preparing for a **Partner Engineering** role, the feature set closely mirrors real-world partner onboarding and internal tooling workflows.

---

## 📂 Project Structure

```text
partner-console-app/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   └── api.js
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── schema.sql
│   │   ├── seed.js
│   │   ├── validators/
│   │   │   └── feedValidator.js
│   │   └── routes/
│   │       ├── analytics.js
│   │       ├── events.js
│   │       ├── feeds.js
│   │       └── partners.js
│   ├── package.json
│   └── ...
│
├── sample-data/
│   ├── sample-feed-valid.xml
│   ├── sample-feed-valid-2.xml
│   ├── sample-feed-valid-3.xml
│   ├── sample-feed-errors.xml
│   ├── sample-feed-errors-2.xml
│   └── sample-feed-errors-3.xml
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or above

---

### Installation

Clone the repository

```bash
git clone https://github.com/Monica-Web88/partner-console-app.git
```

Install Backend Dependencies

```bash
cd partner-console-app/server
npm install
```

Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## ▶️ Run the Project

### Backend

```bash
cd server
npm start
```

Runs at:

```
http://localhost:4000
```

### Frontend

```bash
cd client
npm run dev
```

Runs at:

```
http://localhost:5173
```

Open your browser:

```
http://localhost:5173
```

Select a partner, then:

- Click **"Try a clean sample"**
- Click **"Try a broken sample"**
- Or upload your own XML feed.

---

## 📄 Sample XML Format

```xml
<program>
  <channelId>...</channelId>
  <airDate>2026-08-04T20:00:00Z</airDate>
  <programTitle>...</programTitle>
  <ratingSystem>TV-14</ratingSystem>
  <closedCaptionUrl>https://...</closedCaptionUrl>
  <durationSeconds>3600</durationSeconds>
  <contentAdvisory>...</contentAdvisory>
  <streamUri>https://...</streamUri>
</program>
```

---

## ☁️ Deployment

- **Frontend:** Vercel
- **Backend:** Render

The frontend reads the backend API URL from the `VITE_API_URL` environment variable, allowing the same codebase to work locally (`localhost:4000`) and in production without code changes.

> **Note:** The backend runs on Render's free tier. The first request after inactivity may take approximately **30 seconds** while the service wakes up.

---

## ⭐ Highlights

- Real XML Feed Validation
- Declarative Rule Engine
- SQLite Data Persistence
- SQL Analytics
- Partner Onboarding Workflow
- Live Activity Tracking
- Field-Level Validation
- Upload Custom XML Feeds
- Interactive Charts with Recharts
- Production Deployment on Vercel & Render

---

## 📬 Contact

**Monica Arunkumar**

GitHub: https://github.com/Monica-Web88
