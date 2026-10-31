# AgriSpine: Complete Technical Documentation & Architecture Reference

> **Platform Version:** 1.0.0-rc  
> **Documentation Target:** Complete Existing Codebase  
> **Target Audiences:** Core Developers, System Architects, DevOps Engineers, AI Engineers, New Contributors  
> **Status:** Comprehensive & Complete Single-File Technical Blueprint  

---

## Table of Contents

1. [Executive Summary & System Purpose](#1-executive-summary--system-purpose)
   - [1.1 What is AgriSpine?](#11-what-is-agrispine)
   - [1.2 Target Personas & Platform Roles](#12-target-personas--platform-roles)
   - [1.3 Core Problems Solved](#13-core-problems-solved)
   - [1.4 System Operational Scope](#14-system-operational-scope)
2. [High-Level Architecture & Component Interactions](#2-high-level-architecture--component-interactions)
   - [2.1 Microservices & Client Breakdown](#21-microservices--client-breakdown)
   - [2.2 Comprehensive Mermaid System Architecture](#22-comprehensive-mermaid-system-architecture)
   - [2.3 Communication Protocols & Data Flow](#23-communication-protocols--data-flow)
   - [2.4 Runtime Environments & Infrastructure Topology](#24-runtime-environments--infrastructure-topology)
3. [Technology Stack & Dependency Inventory](#3-technology-stack--dependency-inventory)
   - [3.1 Backend Infrastructure (Node.js & Express)](#31-backend-infrastructure-nodejs--express)
   - [3.2 Frontend Web Client (React & Vite)](#32-frontend-web-client-react--vite)
   - [3.3 Admin Portal (React & Vite)](#33-admin-portal-react--vite)
   - [3.4 AI Microservice (Python & FastAPI)](#34-ai-microservice-python--fastapi)
   - [3.5 Mobile Application (Flutter & Dart)](#35-mobile-application-flutter--dart)
   - [3.6 Comprehensive Environment Variables Reference](#36-comprehensive-environment-variables-reference)
4. [Repository Structure & File-by-File Guide](#4-repository-structure--file-by-file-guide)
   - [4.1 Global Repository Tree](#41-global-repository-tree)
   - [4.2 Backend Directory Anatomy (`backend/`)](#42-backend-directory-anatomy-backend)
   - [4.3 Frontend Web Directory Anatomy (`frontend/`)](#43-frontend-web-directory-anatomy-frontend)
   - [4.4 Admin Portal Anatomy (`admin/`)](#44-admin-portal-anatomy-admin)
   - [4.5 AI Microservice Anatomy (`ai/`)](#45-ai-microservice-anatomy-ai)
   - [4.6 Flutter Mobile App Anatomy (`app/`)](#46-flutter-mobile-app-anatomy-app)
5. [Database Architecture & Data Models (MongoDB / Mongoose)](#5-database-architecture--data-models-mongodb--mongoose)
   - [5.1 Entity-Relationship Diagram (Mermaid ERD)](#51-entity-relationship-diagram-mermaid-erd)
   - [5.2 Detailed Mongoose Schema Specifications](#52-detailed-mongoose-schema-specifications)
     - [`User.js`](#userjs)
     - [`AdminUser.js`](#adminuserjs)
     - [`CropCycle.js`](#cropcyclejs)
     - [`Machine.js`](#machinejs)
     - [`Booking.js`](#bookingjs)
     - [`WorkGroup.js`](#workgroupjs)
     - [`WorkRecord.js`](#workrecordjs)
     - [`Settlement.js`](#settlementjs)
     - [`Conversation.js`](#conversationjs)
     - [`Message.js`](#messagejs)
     - [`Poll.js`](#polljs)
     - [`Post.js`](#postjs)
     - [`Notification.js`](#notificationjs)
     - [`AIChat.js`](#aichatjs)
     - [`MandiRate.js`](#mandiratejs)
     - [`Scheme.js`](#schemejs)
     - [`UserRelations.js`](#userrelationsjs)
   - [5.3 Database Indexing, Garbage Collection & Migration Scripts](#53-database-indexing-garbage-collection--migration-scripts)
6. [Complete Backend REST & WebSocket API Reference](#6-complete-backend-rest--websocket-api-reference)
   - [6.1 Authentication & Profile APIs (`/auth`)](#61-authentication--profile-apis-auth)
   - [6.2 Crop & Market Listing APIs (`/crops`)](#62-crop--market-listing-apis-crops)
   - [6.3 Machinery & Equipment APIs (`/machines`)](#63-machinery--equipment-apis-machines)
   - [6.4 Machinery Booking Lifecycle APIs (`/bookings`)](#64-machinery-booking-lifecycle-apis-bookings)
   - [6.5 Labor Work Groups & Wage Settlements APIs (`/api/groups`)](#65-labor-work-groups--wage-settlements-apis-apigroups)
   - [6.6 Real-Time Messenger & Chat APIs (`/chat`)](#66-real-time-messenger--chat-apis-chat)
   - [6.7 Real-Time Sockets Protocol (`socket.io`)](#67-real-time-sockets-protocol-socketio)
   - [6.8 Community Forum & Replies APIs (`/community`)](#68-community-forum--replies-apis-community)
   - [6.9 In-Chat Polls APIs (`/poll`)](#69-in-chat-polls-apis-poll)
   - [6.10 In-App Notifications APIs (`/api/notifications`)](#610-in-app-notifications-apis-apinotifications)
   - [6.11 GramSathi AI Backend Bridge APIs (`/api/ai`)](#611-gramsathi-ai-backend-bridge-apis-apiai)
   - [6.12 SuperAdmin Portal APIs (`/admin`)](#612-superadmin-portal-apis-admin)
7. [Feature-by-Feature Technical Deep Dive](#7-feature-by-feature-technical-deep-dive)
   - [7.1 Authentication, Security & Role Access](#71-authentication-security--role-access)
   - [7.2 Farmer Profiles & Agricultural Land Management](#72-farmer-profiles--agricultural-land-management)
   - [7.3 Crop Lifecycle & Financial Tracking](#73-crop-lifecycle--financial-tracking)
   - [7.4 Agricultural Equipment & Rental Machinery Engine](#74-agricultural-equipment--rental-machinery-engine)
   - [7.5 Machinery Booking Lifecycle & Garbage Collection](#75-machinery-booking-lifecycle--garbage-collection)
   - [7.6 Real-Time Messenger, Village Groups, Reactions & Polls](#76-real-time-messenger-village-groups-reactions--polls)
   - [7.7 Labor Work Groups, Daily Wage Calculations & Settlement Engine](#77-labor-work-groups-daily-wage-calculations--settlement-engine)
   - [7.8 Buyer-Seller Marketplace (Direct Farm-to-Buyer)](#78-buyer-seller-marketplace-direct-farm-to-buyer)
   - [7.9 Mandi Rates & Market Price Discovery](#79-mandi-rates--market-price-discovery)
   - [7.10 Government Schemes Directory](#710-government-schemes-directory)
   - [7.11 Community Forum & Knowledge Exchange](#711-community-forum--knowledge-exchange)
   - [7.12 Agricultural Weather & Micro-Forecasts](#712-agricultural-weather--micro-forecasts)
   - [7.13 Plant Doctor Disease Diagnosis (Demo / Mocked AI)](#713-plant-doctor-disease-diagnosis-demo--mocked-ai)
   - [7.14 Localization (i18n) & Dynamic Language Switching](#714-localization-i18n--dynamic-language-switching)
   - [7.15 Theme Management (Light / Dark Mode)](#715-theme-management-light--dark-mode)
   - [7.16 SuperAdmin Dashboard & Platform Moderation](#716-superadmin-dashboard--platform-moderation)
8. [GramSathi AI Multi-Agent Architecture](#8-gramsathi-ai-multi-agent-architecture)
   - [8.1 Agent System Philosophy & Router Pattern](#81-agent-system-philosophy--router-pattern)
   - [8.2 Intent Classification & Fallback Models](#82-intent-classification--fallback-models)
   - [8.3 Prompt Engineering & System Context Injection](#83-prompt-engineering--system-context-injection)
   - [8.4 Task Registry & Specialized Agent Workers](#84-task-registry--specialized-agent-workers)
   - [8.5 Context Resolution & Smart Fuzzy Matching](#85-context-resolution--smart-fuzzy-matching)
   - [8.6 Reverse Route Registry & UI Action Dispatch](#86-reverse-route-registry--ui-action-dispatch)
   - [8.7 Voice Input & Audio Processing Pipeline](#87-voice-input--audio-processing-pipeline)
   - [8.8 Cold Start Mitigation & Resilience Strategies](#88-cold-start-mitigation--resilience-strategies)
9. [End-to-End Execution Workflows](#9-end-to-end-execution-workflows)
   - [9.1 User Onboarding & Authentication Flow](#91-user-onboarding--authentication-flow)
   - [9.2 Machinery Booking Request & Approval Lifecycle](#92-machinery-booking-request--approval-lifecycle)
   - [9.3 Labor Work Recording & Partial Settlement Execution](#93-labor-work-recording--partial-settlement-execution)
   - [9.4 Voice-Driven Crop Addition via GramSathi AI](#94-voice-driven-crop-addition-via-gramsathi-ai)
   - [9.5 Real-Time Poll Creation and Voting in Chat](#95-real-time-poll-creation-and-voting-in-chat)
10. [Flutter Mobile Application Architecture (`app/`)](#10-flutter-mobile-application-architecture-app)
    - [10.1 State Management (Riverpod) & Networking (Dio)](#101-state-management-riverpod--networking-dio)
    - [10.2 Navigation & GoRouter Shell Route Architecture](#102-navigation--gorouter-shell-route-architecture)
    - [10.3 Mobile Feature Set & Parity Analysis](#103-mobile-feature-set--parity-analysis)
11. [Security, Authorization & Validation Architecture](#11-security-authorization--validation-architecture)
    - [11.1 Password Hashing & JWT Verification](#111-password-hashing--jwt-verification)
    - [11.2 Role-Based Access Control (RBAC)](#112-role-based-access-control-rbac)
    - [11.3 File Upload Security & Multer Configuration](#113-file-upload-security--multer-configuration)
    - [11.4 User Privacy, Safety & User Blocking System](#114-user-privacy-safety--user-blocking-system)
12. [Environment Setup & Local Execution Guide](#12-environment-setup--local-execution-guide)
    - [12.1 Prerequisites & System Requirements](#121-prerequisites--system-requirements)
    - [12.2 Backend Node.js Server Setup](#122-backend-nodejs-server-setup)
    - [12.3 Frontend React Client Setup](#123-frontend-react-client-setup)
    - [12.4 Admin React Portal Setup](#124-admin-react-portal-setup)
    - [12.5 AI FastAPI Microservice Setup](#125-ai-fastapi-microservice-setup)
    - [12.6 Flutter Mobile App Setup](#126-flutter-mobile-app-setup)
13. [Current Implementation Status & Verification Matrix](#13-current-implementation-status--verification-matrix)
    - [13.1 Production-Ready Features](#131-production-ready-features)
    - [13.2 Partially Implemented / Demo Features](#132-partially-implemented--demo-features)
    - [13.3 Mocked & Placeholder Features](#133-mocked--placeholder-features)
    - [13.4 Planned or Missing Features](#134-planned-or-missing-features)
14. [Known Issues, Bugs & Code Discrepancies](#14-known-issues-bugs--code-discrepancies)
    - [14.1 Confirmed Code Bugs & Route Mismatches](#141-confirmed-code-bugs--route-mismatches)
    - [14.2 AI Agent Parameter Mismatches](#142-ai-agent-parameter-mismatches)
    - [14.3 Frontend-to-Backend Contract Discrepancies](#143-frontend-to-backend-contract-discrepancies)
    - [14.4 Architectural & Scalability Bottlenecks](#144-architectural--scalability-bottlenecks)
15. [Recommended Improvements & Future Roadmap](#15-recommended-improvements--future-roadmap)
16. [Completeness Verification & Sign-Off](#16-completeness-verification--sign-off)

---

## 1. Executive Summary & System Purpose

### 1.1 What is AgriSpine?
**AgriSpine** is a full-stack, AI-augmented digital agriculture and rural operations platform designed to empower smallholder farmers, agricultural machinery providers, rural labor groups, and commodity buyers across Indian rural ecosystems.

The platform bridges longstanding communication, financial, and operational gaps in rural agriculture by combining:
1. **Farm Recordkeeping & Profitability Tracking**: Real-time expense, harvest, yield, and revenue analytics per crop.
2. **Machinery Sharing Economy**: An agricultural equipment rental marketplace (tractors, harvesters, sprayers, drones) with transparent pricing and booking lifecycles.
3. **Labor Work Groups & Wage Settlement Engine**: A digital ledger for rural worker collectives (daily labor groups) that manages attendance, piece-rate/per-acre wage calculations, and transparent financial settlements.
4. **Direct-to-Buyer Marketplace**: Disintermediation of middlemen by allowing farmers to list harvest batches directly to wholesale buyers.
5. **Real-Time Village Messaging & Community Forum**: WhatsApp/Telegram-grade encrypted socket chat with audio notes, file attachments, media viewing, and live polls.
6. **GramSathi AI Autonomous Multi-Agent Assistant**: A natural language and voice-enabled conversational assistant that enables semi-literate farmers to operate the entire application (adding crops, recording expenses, searching equipment, sending messages) in their native dialects (Telugu, Hindi, and Indian English).

### 1.2 Target Personas & Platform Roles

AgriSpine establishes three primary user roles at registration, complemented by internal system roles:

| Persona / Role | Role Key in Code | Primary Responsibilities & Permissions |
| :--- | :--- | :--- |
| **Farmer** | `farmer` | Records crop cycles, tracks farming expenses, books rental machinery, joins village chat groups, participates in daily work groups, views Mandi rates and government schemes, interacts with GramSathi AI. |
| **Machinery Provider** | `provider` | Lists agricultural equipment and machinery with hourly/daily/acre rates, accepts or rejects incoming booking requests from farmers, manages fleet availability. |
| **Commodity Buyer** | `buyer` | Explores harvest listings directly posted by farmers, filters by crop and district, contacts farmers directly via phone to negotiate bulk procurement. |
| **Work Group Admin / Owner** | `owner` / `admin` | Embedded role within `WorkGroup`: Creates labor collectives, registers member profiles (online users and offline proxy members), records daily farm work logs, marks member attendance, computes wage distributions, and executes settlements. |
| **Work Group Member** | `member` | Embedded role within `WorkGroup`: Views personal work history, verified days worked, cumulative earnings, and pending wage settlements. |
| **SuperAdmin** | `superadmin` | Authenticates via a separate `AdminUser` model and dedicated `/admin` portal: Seeds official data, publishes government schemes, updates daily APMC Mandi rates, and oversees platform health. |

### 1.3 Core Problems Solved

1. **Information Asymmetry in Farm Finance**: Farmers frequently underestimate cost of cultivation due to undocumented cash outlays on seeds, fertilizers, diesel, and labor. AgriSpine provides automated per-crop profit/loss and expense breakdown charts.
2. **Machinery Underutilization & High Rental Friction**: Capital-intensive machinery sits idle during off-peak days, while smallholders struggle to locate equipment during critical harvesting windows. AgriSpine establishes an on-demand peer-to-peer equipment exchange.
3. **Exploitative Rural Labor Wage Accounting**: Rural labor groups rely on memory or paper notebooks for attendance and wage splitting. Landowners often delay bulk payments, making individual worker distributions error-prone and opaque. AgriSpine’s WorkGroup ledger automates proportional wage calculations (`(acres * ratePerAcre + extras) / attendance`) and tracks partial and full settlements.
4. **Digital Divide & Literacy Barriers**: Many farmers struggle with complex digital menus. GramSathi AI allows farmers to speak or type in natural language, automatically resolving IDs and executing database operations.

### 1.4 System Operational Scope

AgriSpine operates across five interconnected codebases:
1. **Backend Server (`backend/`)**: Node.js v20+ / Express v5 REST API with MongoDB (Mongoose) and real-time Socket.IO.
2. **Frontend Web Application (`frontend/`)**: React 19 + Vite SPA with Tailwind CSS, Axios, Lucide icons, Recharts, and `i18next` multi-language localization.
3. **Admin Web Portal (`admin/`)**: Independent React 19 + Vite dashboard for platform administrators to manage schemes, Mandi rates, and data seeding.
4. **GramSathi AI Microservice (`ai/`)**: Python 3.10+ / FastAPI multi-agent engine orchestrating HuggingFace open-source LLMs (Qwen2.5, Llama-3.2, Mistral), fuzzy entity matching, and reverse REST mutations against Node.js.
5. **Mobile Application (`app/`)**: Production-ready Flutter 3.12+ cross-platform mobile client for Android and iOS using Riverpod and Dio.

---

## 2. High-Level Architecture & Component Interactions

### 2.1 Microservices & Client Breakdown

The AgriSpine platform operates on a distributed microservices pattern:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                           │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │   React Web App (Farmer)  │      │   Flutter Mobile App (iOS/  │   │
│   │   Vite + Tailwind + i18n  │      │   Android) Riverpod + Dio   │   │
│   └─────────────┬─────────────┘      └──────────────┬──────────────┘   │
│                 │                                   │                  │
│                 │      ┌────────────────────────────┐                  │
│                 │      │  Admin Portal (SuperAdmin) │                  │
│                 │      │  React + Vite + Tailwind   │                  │
│                 │      └─────────────┬──────────────┘                  │
└─────────────────┼────────────────────┼──────────────┼──────────────────┘
                  │                    │              │
       HTTP / REST (JWT Auth)          │      HTTP / REST
       WebSocket (Socket.IO)           │      WebSocket
                  │                    │              │
                  ▼                    ▼              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       CORE BACKEND SERVICE (Node.js)                   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Express 5.x REST API Router                                    │   │
│   │  ├── /auth          ├── /crops        ├── /machines            │   │
│   │  ├── /bookings      ├── /api/groups   ├── /chat                │   │
│   │  ├── /poll          ├── /community    ├── /api/notifications   │   │
│   │  └── /admin         └── /api/ai                                │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────┴─────────────────────────────────┐   │
│   │ Socket.IO Server Engine                                        │   │
│   │  ├── Real-time Messaging (1-on-1 & Group)                       │   │
│   │  ├── Live Poll Voting Broadcast                                │   │
│   │  ├── Read Receipts & Typing Status                             │   │
│   │  └── Soft Delete & Emoji Reaction Sync                         │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │
              ┌────────────────────┴─────────────────────┐
              │                                          │
              ▼                                          ▼
┌──────────────────────────────┐       ┌─────────────────────────────────┐
│     DATABASE STORAGE LAYER   │       │   GRAMSATHI AI SERVICE (FastAPI)│
│                              │       │                                 │
│  MongoDB Atlas Cluster       │       │  FastAPI (Python) Microservice  │
│  - 17 Collections / Models   │       │   ├── Intent Classification     │
│  - ACID Subdocument Support  │       │   ├── Multi-Agent Task Registry │
│  - TTL & Lifecycle Cleanups  │       │   ├── Smart Fuzzy Matcher       │
│                              │       │   └── Reverse Node.js Mutator   │
└──────────────────────────────┘       └────────────────┬────────────────┘
                                                        │
                                                        ▼
                                       ┌─────────────────────────────────┐
                                       │       EXTERNAL AI INFERENCE     │
                                       │                                 │
                                       │  HuggingFace Inference API      │
                                       │  - Qwen2.5-Coder-32B            │
                                       │  - Llama-3.2-3B                 │
                                       │  - Zephyr-7B / Mistral-7B       │
                                       └─────────────────────────────────┘
```

### 2.2 Comprehensive Mermaid System Architecture

```mermaid
flowchart TD
    subgraph Clients["Client Presentation Tier"]
        WEB["React Web App (Port 5173)\nReact 19, Tailwind, i18next"]
        MOB["Flutter Mobile App\nDart, Riverpod, Dio"]
        ADM["Admin Dashboard (Port 5174)\nReact 19, Vite, Tailwind"]
    end

    subgraph NodeBackend["Node.js / Express Core Service (Port 5000)"]
        RT["Express REST Router"]
        WS["Socket.IO Server Engine"]
        MW["Middleware Tier\n- fetchUser (JWT Auth)\n- Multer Disk Storage\n- CORS Enforcer"]
        CTR["Controllers\n- authController\n- cropController\n- machineController\n- bookingController\n- groupController\n- chatController\n- aiController\n- adminController"]
        SRV["Business Logic Services\n- groupService.js\n- aiService.js"]
    end

    subgraph FastAIService["GramSathi AI Microservice (Port 8000)"]
        FROUTER["FastAPI Router (/api/ai/chat)"]
        ENG["Deterministic Task Engine\nengine.py"]
        HFE["HuggingFaceEngine\nFallback Pipeline"]
        REG["TASK_REGISTRY (8 Specialized Agents)"]
        MATCHER["Smart Matcher & Context Resolver"]
        APICLI["Reverse API Client (HTTP Requests)"]
    end

    subgraph Storage["Persistence & External Services"]
        MDB[("MongoDB Atlas Database\n17 Schemas")]
        HFAPI["HuggingFace Serverless Inference"]
        OWM["OpenWeatherMap API"]
        CLD["Cloudinary Media Storage"]
    end

    WEB <-->|REST / JSON & WebSockets| NodeBackend
    MOB <-->|REST / JSON & WebSockets| NodeBackend
    ADM <-->|REST / JSON (Admin-Token)| NodeBackend

    NodeBackend <-->|Mongoose Driver| MDB
    NodeBackend <-->|HTTP Proxy Forwarding\nPOST /chat (User Context)| FastAIService

    FROUTER --> ENG
    ENG --> HFE
    HFE <-->|Inference Calls (Chat Completion)| HFAPI
    ENG --> REG
    REG --> MATCHER
    REG --> APICLI
    APICLI -->|Authorized REST Mutations\n(POST, PUT, DELETE)| NodeBackend

    WEB -.->|Live Weather Data| OWM
    WEB -.->|Plant Doctor Uploads| CLD
```

### 2.3 Communication Protocols & Data Flow

1. **Client to Backend (REST)**: All data mutation and standard retrieval occurs over HTTPS/HTTP via standard JSON payloads. All protected routes require an `auth-token` HTTP request header containing a signed JWT.
2. **Client to Backend (Real-Time WebSockets)**: The messaging module and poll voting engine connect directly to the Node.js HTTP server via WebSocket (`socket.io` client). The socket client joins conversation-specific rooms (`socket.join(conversationId)`).
3. **Backend to AI Service (HTTP Proxy)**: The frontend sends chat and voice prompts to `backend/routes/aiRoutes.js`. The backend extracts user identity, populates user context (registered land plots, active crops, tractors owned, preferred language), and issues an HTTP POST request to FastAPI (`http://localhost:8000/api/ai/chat`).
4. **AI Service to Backend (Reverse Tool Execution)**: When the LLM decides on an intent that alters database state (e.g., `CROP_ADD`, `MACHINERY_BOOK`, `MESSENGER_SEND`), the AI agent uses `ai/core/api_client.py` to make an authorized HTTP request back to the Node.js backend using the original user's `auth-token`.
5. **AI Service to LLM Inference**: FastAPI communicates asynchronously with the HuggingFace Inference API over HTTPS using `huggingface-hub`'s `InferenceClient`.

### 2.4 Runtime Environments & Infrastructure Topology

- **Local Development**:
  - Node.js backend runs on `http://localhost:5000` (auto-increments if port is busy).
  - React frontend runs on `http://localhost:5173`.
  - Admin dashboard runs on `http://localhost:5174`.
  - FastAPI AI microservice runs on `http://localhost:8000` via `uvicorn`.
- **Cloud / Production Topology (as configured in repository)**:
  - Backend: Hosted on Render (`https://agrispine-backend.onrender.com/api`).
  - AI Microservice: Hosted on Render (`https://agrispine-ai.onrender.com`).
  - Database: MongoDB Atlas cloud cluster (`agrispine.j5fexn4.mongodb.net`).
  - Media Uploads: Local storage under `backend/uploads/` (static Express serving) and Cloudinary cloud CDN (`dv2ex5war`).

---

## 3. Technology Stack & Dependency Inventory

### 3.1 Backend Infrastructure (Node.js & Express)
*Source: `backend/package.json`*

| Package | Version | Purpose | Usage Location |
| :--- | :--- | :--- | :--- |
| `express` | `^5.2.1` | Core REST routing engine and HTTP middleware pipeline | `backend/index.js`, all route definitions |
| `mongoose` | `^9.0.1` | ODM (Object Data Modeling) for MongoDB | `backend/models/*.js`, connection in `index.js` |
| `socket.io` | `^4.8.3` | Bidirectional real-time event engine for messenger & polls | `backend/index.js` (Room management & messaging) |
| `jsonwebtoken` | `^9.0.3` | Cryptographic JWT generation and claims verification | `backend/controllers/authController.js`, `fetchUser.js` |
| `bcryptjs` | `^3.0.3` | Salted password hashing (10 salt rounds) | `backend/controllers/authController.js`, `adminController.js` |
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing policy enforcement | `backend/index.js` |
| `dotenv` | `^17.2.3` | Environment variable parsing from `.env` | `backend/index.js`, scripts |
| `multer` | `^2.2.0` | Multi-part form-data handler for chat & group image files | `backend/middlewares/uploadMiddleware.js` |
| `axios` | `^1.18.1` | Outbound HTTP client for forwarding payloads to FastAPI | `backend/services/aiService.js` |
| `form-data` | `^4.0.6` | Multipart form generation for proxying voice audio | `backend/controllers/aiController.js` |
| `nodemon` | `^3.1.11` | Dev dependency for hot-reloading backend processes | `backend/package.json` |

### 3.2 Frontend Web Client (React & Vite)
*Source: `frontend/package.json`*

| Package | Version | Purpose | Usage Location |
| :--- | :--- | :--- | :--- |
| `react` / `react-dom`| `^19.2.0` | UI component library (React 19) | All components and pages in `frontend/src/` |
| `vite` | `^7.2.4` | Build tool and fast HMR development server | `frontend/vite.config.js` |
| `react-router-dom` | `^7.10.1` | Client-side routing, protected routes, URL parameters | `frontend/src/App.jsx` |
| `tailwindcss` | `^3.4.17` | Utility-first CSS framework | `frontend/tailwind.config.js`, `index.css` |
| `axios` | `^1.13.2` | REST client with request/response interceptors | `frontend/src/utils/api.js` |
| `socket.io-client` | `^4.8.3` | Real-time WebSocket connection to backend | `frontend/src/pages/messages/Messenger.jsx` |
| `i18next` | `^25.8.0` | Internationalization framework | `frontend/src/i18n.js` |
| `react-i18next` | `^16.5.3` | React bindings and `useTranslation` hook | All translated UI components |
| `i18next-http-backend` | `^3.0.2` | Asynchronously loads locale JSONs via HTTP | `frontend/src/i18n.js` |
| `i18next-browser-languagedetector` | `^8.2.0` | Detects and caches user language in `localStorage` | `frontend/src/i18n.js` |
| `lucide-react` | `^0.561.0` | Vector icon set | Throughout navigation, cards, and buttons |
| `recharts` | `^3.6.0` | Data visualization (Bar charts, Pie charts, Area graphs) | `Reports.jsx`, `Weather.jsx`, Group dashboards |
| `sweetalert2` | `^11.26.10` | Accessible, modern dialogs, confirmations, and toasts | Success/error popups across all forms |
| `jspdf` & `jspdf-autotable` | `^4.2.1` / `^5.0.8`| Client-side PDF generation for labor reports | `frontend/src/utils/ReportExport.js` |
| `xlsx` | `^0.18.5` | Client-side Excel (.xlsx) spreadsheet export | `frontend/src/utils/ReportExport.js` |
| `emoji-picker-react` | `^4.16.1` | Native emoji picker for messenger chat | `frontend/src/pages/messages/components/ChatWindow.jsx` |
| `date-fns` | `^4.4.0` | Date manipulation and formatting | Used across message timestamps and group logs |

### 3.3 Admin Portal (React & Vite)
*Source: `admin/package.json`*

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` / `react-dom` | `^19.2.6` | Core UI engine |
| `vite` | `^8.0.12` | Next-generation bundler |
| `react-router-dom` | `^7.17.0` | Navigation & admin layout routing |
| `axios` | `^1.17.0` | API communication with `admin-token` header injection |
| `sweetalert2` | `^11.26.25` | Modal notifications and destructive action confirmations |
| `lucide-react` | `^1.17.0` | UI icons |
| `tailwindcss` | `^3.4.19` | Styling |

### 3.4 AI Microservice (Python & FastAPI)
*Source: `ai/requirements.txt`*

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `fastapi` | `0.111.0` | High-performance asynchronous REST microservice framework |
| `uvicorn` | `0.30.1` | ASGI web server implementation |
| `huggingface-hub` | `0.34.4` | Client for HuggingFace Serverless Inference API |
| `pydantic` | `2.7.4` | Data validation, payload models, and strict JSON parsing |
| `pydantic-settings`| `2.3.4` | Configuration loading from `.env` files |
| `httpx` | `0.27.0` | Asynchronous HTTP client |
| `python-multipart` | `0.0.9` | Multipart form decoding for voice audio uploads |
| `python-dotenv` | `1.0.1` | Reads environmental parameters |
| `SpeechRecognition`| `3.14.3` | Python audio processing and speech-to-text decoding |
| `langchain-google-genai` | `1.0.6` | Google Gemini API integration (configured as alternative engine) |
| `aiofiles` | Latest | Asynchronous filesystem reading and writing |

### 3.5 Mobile Application (Flutter & Dart)
*Source: `app/pubspec.yaml`*

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `flutter` | `sdk: flutter` | Cross-platform native compilation engine |
| `flutter_riverpod` | `^3.3.2` | Reactive state management and dependency injection |
| `go_router` | `^17.3.0` | Declarative URL-based routing with stateful bottom navigation |
| `dio` | `^5.9.2` | Advanced HTTP client with interceptors for JWT token attachment |
| `flutter_secure_storage` | `^10.3.1`| Encrypted local keychain/keystore storage for JWT authentication |
| `shared_preferences` | `^2.5.5` | Local persistent key-value store for user preferences |
| `socket_io_client` | `^3.1.6` | Dart WebSocket client for real-time mobile messenger |
| `jwt_decoder` | `^2.0.1` | Client-side parsing and expiry verification of auth tokens |
| `easy_localization` | `^3.0.8` | Cross-platform multi-language localization framework |

### 3.6 Comprehensive Environment Variables Reference

> [!CAUTION]
> Never commit actual production API keys or database credentials to version control. The following table describes the variables required by the system.

| Variable Name | Component | Required? | Purpose & Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend (`backend/.env`) | Optional (Default: `5000`) | Network port for Node.js Express server. Auto-increments if port is occupied. |
| `MONGO_URI` | Backend (`backend/.env`) | **Required** | MongoDB connection string (Atlas URI or local `mongodb://localhost:27017/agrispine`). |
| `JWT_SECRET` | Backend (`backend/.env`) | **Required** | Cryptographic key used to sign and verify user and admin authentication JWT tokens. |
| `AI_SERVICE_URL` | Backend (`backend/.env`) | **Required** | Full URL of the FastAPI AI microservice (e.g., `http://localhost:8000` or Render URL). |
| `VITE_API_BASE_URL` | Frontend (`frontend/.env`) | **Required** | Base URL pointing to the Node.js backend API (e.g., `http://localhost:5000`). |
| `VITE_WEATHER_API_KEY` | Frontend (`frontend/.env`) | **Required** | OpenWeatherMap API key used for live temperature, humidity, and forecasts. |
| `VITE_API_BASE_URL` | Admin (`admin/.env`) | **Required** | Target backend URL for SuperAdmin portal operations. |
| `HUGGINGFACEHUB_API_TOKEN` | AI (`ai/.env`) | **Required** | Access token for HuggingFace Inference API to execute LLM intent classification. |
| `GEMINI_API_KEY` | AI (`ai/.env`) | Optional | Google Gemini API key if using `GeminiEngine` instead of HuggingFace. |
| `BACKEND_URL` | AI (`ai/.env`) | Optional (Default: `http://localhost:5000`) | Outbound URL the AI uses to mutate the Node.js backend. |

---

## 4. Repository Structure & File-by-File Guide

### 4.1 Global Repository Tree

```
AgriSpine/
├── .gitignore
├── AGRISPINE_ARCHITECTURE_EXPLAINED.md
├── merge_locales.js                # Build utility for merging translation JSON strings
├── docs/                           # Official Technical Documentation Directory
│   └── AGRISPINE_COMPLETE_TECHNICAL_DOCUMENTATION.md
├── backend/                        # Node.js + Express + Socket.IO Backend Server
├── frontend/                       # React 19 + Vite Farmer/User Client SPA
├── admin/                          # React 19 + Vite SuperAdmin Management Portal
├── ai/                             # Python FastAPI Multi-Agent Microservice (GramSathi)
└── app/                            # Flutter 3.x Cross-Platform iOS/Android Mobile Client
```

### 4.2 Backend Directory Anatomy (`backend/`)

```
backend/
├── index.js                        # Master entrypoint: Express init, Socket.IO setup, DB connect, route mounting
├── migrate_chats.js                # Migration script converting legacy village chats into Conversation models
├── package.json                    # Backend dependencies & npm scripts
├── .env                            # Backend environment configuration
├── controllers/                    # Business logic implementations
│   ├── adminController.js          # Superadmin auth, data seeding, schemes & mandi rates CRUD
│   ├── aiController.js             # AI session chat persistence, FastAPI request forwarding & voice proxy
│   ├── authController.js           # Registration, login, profile updates, user search, blocking system
│   ├── bookingController.js        # Machinery booking lifecycle, garbage collection, status transitions
│   ├── chatController.js           # Conversations, messages, stars, reactions, pins, soft/hard deletion
│   ├── cropController.js           # Crop cycles, expense entries, revenue records, market listings
│   ├── groupController.js          # Labor work groups, attendance, settlements, analytics, roles
│   ├── machineController.js        # Machinery listings, category filtering, owner fleet management
│   ├── notificationController.js   # In-app notifications fetch and mark-as-read
│   ├── pollController.js           # Interactive chat poll creation, retrieval, and voting
│   └── postController.js           # Community discussion forum questions and nested replies
├── middlewares/
│   ├── fetchUser.js                # Intercepts requests, validates JWT 'auth-token', attaches req.user
│   └── uploadMiddleware.js         # Multer disk configuration for image and audio file uploads
├── models/                         # Mongoose data schema definitions
│   ├── AdminUser.js                # Superadmin credential and role schema
│   ├── AIChat.js                   # Persistent GramSathi AI conversation threads & message history
│   ├── Booking.js                  # Agricultural machinery rental reservation instances
│   ├── Conversation.js             # 1-on-1 and group chat threads with pinned message pointers
│   ├── CropCycle.js                # Farmer crops, sowing date, area, expenses array, market sale flags
│   ├── Machine.js                  # Equipment listings, hourly/daily/acre rates, provider reference
│   ├── MandiRate.js                # APMC market commodity price logs with trend indicators
│   ├── Message.js                  # Individual chat messages, attachments, reactions, read status
│   ├── Notification.js             # User alerts for labor additions, work records, settlements
│   ├── Poll.js                     # In-chat voting options and user vote tracking
│   ├── Post.js                     # Community forum questions and replies array
│   ├── Scheme.js                   # Central & state government agricultural subsidy records
│   ├── Settlement.js               # Labor group payout records with member distribution arrays
│   ├── User.js                     # Core user identity, role, village, land plots, blocked users
│   ├── UserRelations.js            # User relationship metadata (favorites, blocking)
│   ├── WorkGroup.js                # Labor collective schema with online & offline member subdocuments
│   └── WorkRecord.js               # Daily farm work log with attendance array and wage calculations
├── routes/                         # Express router endpoint mappings
│   ├── adminRoutes.js              # /admin endpoints
│   ├── aiRoutes.js                 # /api/ai endpoints
│   ├── authRoutes.js               # /auth endpoints
│   ├── bookingRoutes.js            # /bookings endpoints
│   ├── chatRoutes.js               # /chat endpoints
│   ├── cropRoutes.js               # /crops endpoints
│   ├── groupRoutes.js              # /api/groups endpoints
│   ├── machineRoutes.js            # /machines endpoints
│   ├── notificationRoutes.js       # /api/notifications endpoints
│   ├── pollRoutes.js               # /poll endpoints
│   └── postRoutes.js               # /community endpoints
├── scripts/
│   └── repairGroups.js             # Database sanitation script to fix missing group owners/members
├── services/
│   ├── aiService.js                # User context compilation, FastAPI connection retry & cold start loop
│   └── groupService.js             # Complex wage math, partial settlement logic, and personal dashboard
├── uploads/                        # Static folder serving uploaded images, audio clips, and documents
└── utils/
    └── notificationHelper.js       # Reusable notification broadcaster for individual and group events
```

### 4.3 Frontend Web Directory Anatomy (`frontend/`)

```
frontend/src/
├── main.jsx                        # React root bootstrapping and i18n initialization
├── App.jsx                         # Main router configuration & layout wrapping
├── i18n.js                         # i18next configuration, backend loader, and language detector
├── index.css                       # Global Tailwind CSS imports and root design variables
├── api/                            # Axios API services
│   ├── axiosClient.js              # Configured Axios instance with auth interceptor
│   └── groupService.js             # Frontend API bindings for /api/groups routes
├── components/
│   ├── BottomNav.jsx               # Fixed mobile-first bottom navigation bar
│   ├── LanguageSwitcher.jsx        # Dropdown triggering language changes and localStorage update
│   ├── ScrollToTop.jsx             # Auto-scrolls window to top on route transitions
│   ├── ThemeToggle.jsx             # Dark/Light mode theme switch button
│   ├── common/                     # Shared UI layout primitives
│   │   ├── PageHeader.jsx          # Reusable header with back button and search slot
│   │   └── SearchInput.jsx         # Debounced search bar input component
│   ├── dashboard/
│   │   └── QuickActions.jsx        # 12-grid shortcut buttons on the farmer dashboard
│   └── ui/                         # Atomic UI design system
│       ├── Button.jsx              # Reusable button with loading spinner
│       ├── Card.jsx                # Surface card wrapper with hover animations
│       ├── EmptyState.jsx          # Illustrated placeholder when data lists are empty
│       └── LoadingState.jsx        # Animated loading skeleton and spinner
├── contexts/
│   └── ThemeContext.jsx            # React Context managing dark/light theme state
├── layouts/
│   └── AppLayout.jsx               # Universal application layout with responsive navigation
├── pages/
│   ├── ai/
│   │   └── GramSathiFullScreen.jsx # Full-screen AI voice/text chat, Web Speech API, chat history
│   ├── auth/
│   │   ├── Login.jsx               # Phone number and password authentication screen
│   │   └── Register.jsx            # Farmer, Provider, Buyer registration form with plot configuration
│   ├── community/
│   │   ├── Community.jsx           # Forum thread list with tab filters (All, My Questions, My Replies)
│   │   └── components/
│   │       ├── NewPostForm.jsx     # Modal form for submitting a new farming question
│   │       └── PostCard.jsx        # Discussion card with like counter and collapsible replies
│   ├── core/
│   │   ├── Dashboard.jsx           # Main farmer home: Weather summary, crops preview, quick actions
│   │   ├── Landing.jsx             # High-conversion public landing page with interactive mockups
│   │   ├── Profile.jsx             # User profile, land plots editor, farming style, blocked users
│   │   └── Weather.jsx             # Detailed 5-day / hourly agro-weather dashboard with charts
│   ├── crops/
│   │   ├── AddCrop.jsx             # New crop cycle registration form
│   │   ├── CropDetails.jsx         # Deep crop view: expenses breakdown, revenue recording, sell toggle
│   │   ├── MyCrops.jsx             # Overview of active, harvested, and sold crops
│   │   └── components/
│   │       ├── ExpenseForm.jsx     # Modal to add chemical, seed, fertilizer, or labor expenses
│   │       └── ExpenseHistory.jsx  # Chronological list of recorded crop expenses with deletion
│   ├── groups/                     # Rural Labor Collective Management
│   │   ├── CreateGroup.jsx         # Create a new work group
│   │   ├── GroupDashboard.jsx      # List of groups user belongs to with cumulative metrics
│   │   ├── GroupDetails.jsx        # Dual-mode container switching between Admin and Member views
│   │   ├── PersonalDashboard.jsx   # Worker personal stats: total earned, pending dues, days worked
│   │   ├── admin/                  # Administrative group management views
│   │   │   ├── AdminDashboard.jsx  # Admin tabs: Overview, Members, Work History, Settlements, Reports
│   │   │   ├── AdminOverview.jsx   # Financial summary cards and quick action triggers
│   │   │   ├── Members.jsx         # Add members (phone search or offline manual), change roles, remove
│   │   │   ├── RecordWorkModal.jsx # Work logger: acres, rates, charges, attendee selection, wage math
│   │   │   ├── Reports.jsx         # PDF/Excel export and crop-wise labor distribution
│   │   │   ├── SettlementManagement.jsx # Execute group-wide or selected worker wage payouts
│   │   │   └── WorkHistory.jsx     # Logged work cards with attendance badges and settlement status
│   │   └── member/                 # Worker self-service views
│   │       ├── MemberDashboard.jsx # Member personal overview for the selected group
│   │       ├── MyHistory.jsx       # Personal attendance logs and wages per day
│   │       ├── MySettlements.jsx   # History of cash/UPI payouts received
│   │       └── MyStats.jsx         # Visual graphs of monthly earnings and attendance rate
│   ├── market/
│   │   ├── BuyerMarket.jsx         # Marketplace for wholesale buyers to browse farmer listings
│   │   └── MarketPrices.jsx        # Searchable APMC Mandi rates table with modal price trends
│   ├── messages/                   # Real-time WebSocket Messenger
│   │   ├── Messenger.jsx           # WhatsApp-style split-pane chat interface
│   │   └── components/
│   │       ├── CameraModal.jsx     # Direct browser webcam capture for attaching photo messages
│   │       ├── ChatHeader.jsx      # Conversation title, avatar, call icons, info toggle
│   │       ├── ChatInfoSidebar.jsx # Group participants, admins, leave group, media gallery
│   │       ├── ChatWindow.jsx      # Message feed, virtual scroll, emoji picker, file dropzone
│   │       ├── CreateGroupModal.jsx# Create custom chat groups and select initial participants
│   │       ├── CreatePollModal.jsx # Configure poll question, multiple options, single/multi choice
│   │       ├── ImageViewer.jsx     # Full-screen lightbox for chat image attachments
│   │       ├── MessageBubble.jsx   # Render text, audio player, image, poll card, reactions, reply quote
│   │       ├── MessageInput.jsx    # Input bar with mic, paperclip attachment, send button
│   │       ├── Sidebar.jsx         # Conversation search, chat list, unread badges, self-chat note
│   │       └── ThemeModal.jsx      # Custom chat wallpaper and bubble color selector
│   ├── rent-machinery/             # Machinery Rental Marketplace
│   │   ├── AddMachine.jsx          # Register equipment (Tractor, Harvester, Drone, Implements)
│   │   ├── ManageMachine.jsx       # Edit pricing, unit (hour/day/acre), or delete machinery listing
│   │   ├── MyBookings.jsx          # Farmer view: Sent rental requests & confirmation statuses
│   │   ├── MyMachines.jsx          # Provider view: Fleet listings & incoming booking requests
│   │   ├── RentCategories.jsx      # Visual category grid for machinery discovery
│   │   ├── RentDetails.jsx         # Equipment specifications, provider profile, booking modal
│   │   └── RentListing.jsx         # Filtered machinery catalog by machine type
│   └── services/
│       ├── PlantDoctor.jsx         # Leaf disease scanner (Cloudinary upload + AI demo simulation)
│       ├── Reports.jsx             # Farm-level financial analytics (P&L, Recharts Bar/Pie graphs)
│       └── Schemes.jsx             # Government subsidies directory with eligibility and application links
└── utils/
    ├── api.js                      # Axios instance injecting `auth-token` from `localStorage`
    ├── ReportExport.js             # Utility functions executing jsPDF and XLSX spreadsheet export
    ├── socket.js                   # Singleton Socket.IO client instance
    ├── translateHelper.js          # Translation utility for dynamic user data
    └── userUtils.js                # Helper functions for formatting user names and avatars
```

### 4.4 Admin Portal Anatomy (`admin/`)

```
admin/src/
├── App.jsx                         # Admin routing: /login, /register, /dashboard, /schemes, /mandi-rates
├── layouts/
│   └── AdminLayout.jsx             # Sidebar navigation layout with SuperAdmin auth verification
├── pages/admin/
│   ├── AdminLanding.jsx            # Gateway screen directing to Admin Login / Setup
│   ├── AdminLogin.jsx              # Admin login with email & password (stores 'admin-token')
│   ├── AdminRegister.jsx           # Register new SuperAdmin user
│   ├── AdminDashboard.jsx          # System overview metrics and 'Seed Default Data' trigger
│   ├── AdminSchemes.jsx            # Full CRUD interface for Government Agricultural Schemes
│   ├── AdminMandiRates.jsx         # Full CRUD interface for APMC Mandi commodity rates
│   ├── AdminUsers.jsx              # Placeholder UI: User Management ("coming soon")
│   ├── AdminGroups.jsx             # Placeholder UI: Work Groups Moderation ("coming soon")
│   ├── AdminPolls.jsx              # Placeholder UI: Polls Management ("coming soon")
│   ├── AdminAnnouncements.jsx      # Placeholder UI: Announcements ("coming soon")
│   └── AdminEvents.jsx             # Placeholder UI: Events ("coming soon")
└── utils/
    └── api.js                      # Admin Axios client injecting `admin-token` header
```

### 4.5 AI Microservice Anatomy (`ai/`)

```
ai/
├── main.py                         # FastAPI initialization, CORS middleware, route mounting
├── requirements.txt                # Python package dependencies
├── .env.example                    # Template for HuggingFace and Gemini API keys
├── core/
│   ├── api_client.py               # Outbound requests wrapper calling Node.js backend with auth-token
│   ├── config.py                   # Pydantic Settings reading GEMINI_API_KEY and HUGGINGFACEHUB_API_TOKEN
│   ├── context_resolver.py         # Fuzzy resolution for crop names, machine types, conversations
│   ├── route_registry.py           # Maps action keys to frontend URLs (e.g. 'crop_details' -> '/crop/{id}')
│   ├── smart_matcher.py            # SequenceMatcher fuzzy algorithm with 90% confidence threshold
│   ├── task_registry.py            # Central registry mapping intent strings to agent worker functions
│   ├── agents/                     # Modular agent workers executing business logic
│   │   ├── community_agent.py      # Posts questions, replies, creates and votes on polls
│   │   ├── crop_agent.py           # Adds crops, sells harvest batches, deletes crop cycles
│   │   ├── expense_agent.py        # Adds and deletes farm expenses against specific crops
│   │   ├── group_agent.py          # Creates work groups, navigates to labor dashboards
│   │   ├── machinery_agent.py      # Searches machinery, books rentals, cancels reservations
│   │   ├── market_agent.py         # Toggles crop market visibility, browses buyer listings
│   │   ├── messenger_agent.py      # Resolves recipient conversations, sends chat messages, clears chats
│   │   └── weather_agent.py        # Fetches live weather conditions via OpenWeatherMap
│   └── engines/
│       ├── base.py                 # Abstract base class AIEngine and Pydantic IntentClassification model
│       ├── gemini.py               # Google Gemini LLM integration stub
│       └── huggingface.py          # Production engine: Chat completion with multi-model fallback & JSON extraction
├── engines/
│   └── engine.py                   # Master process_request pipeline: prompt build -> intent parse -> tool execute
├── prompts/
│   └── system_prompts.py           # System prompt generator injecting user context, page context, language
├── router/
│   ├── chat.py                     # POST /api/ai/chat endpoint handling text queries
│   └── voice.py                    # POST /api/ai/voice endpoint handling raw audio speech files
└── schemas/
    └── chat.py                     # Pydantic schemas: ChatMessage, ChatRequest, ChatResponse
```

### 4.6 Flutter Mobile App Anatomy (`app/`)

```
app/lib/
├── main.dart                       # Entry point, ProviderScope, MaterialApp.router
├── core/
│   ├── network/
│   │   └── dio_client.dart         # Dio HTTP client injecting stored JWT tokens
│   ├── router/
│   │   └── app_router.dart         # GoRouter setup with StatefulShellRoute bottom navigation
│   └── theme/
│       └── app_theme.dart          # Light and dark agro-themed Material 3 design system
└── features/
    ├── auth/                       # Login, Register, Profile models, Riverpod providers & screens
    ├── community/                  # Discussion forum feed, post creation, comments screen
    ├── dashboard/                  # Farmer dashboard with weather cards, crops summary, quick actions
    ├── machinery/                  # Equipment rental catalog, machine details, and booking modal
    ├── market/                     # Mandi rates list and buyer marketplace browser
    ├── messages/                   # Real-time WebSocket chat room list and chat window
    ├── plant_doctor/               # Camera capture and leaf disease detection UI
    ├── profile/                    # User profile view and editing screen
    └── schemes/                    # Government subsidy schemes viewer
```

---

## 5. Database Architecture & Data Models (MongoDB / Mongoose)

### 5.1 Entity-Relationship Diagram (Mermaid ERD)

```mermaid
erDiagram
    User ||--o{ CropCycle : "owns"
    User ||--o{ Machine : "owns/provides"
    User ||--o{ Booking : "creates (farmer)"
    User ||--o{ Booking : "receives (provider)"
    User ||--o{ WorkGroup : "creates (owner)"
    User ||--o{ WorkRecord : "records"
    User ||--o{ Settlement : "processes"
    User ||--o{ Post : "authors"
    User ||--o{ Notification : "receives"
    User ||--o{ AIChat : "owns"
    User ||--o{ UserRelations : "has"
    User }o--o{ Conversation : "participates in"

    WorkGroup ||--o{ WorkRecord : "contains"
    WorkGroup ||--o{ Settlement : "contains"
    WorkRecord }o--o{ Settlement : "included in"

    Conversation ||--o{ Message : "contains"
    Conversation ||--o{ Poll : "hosts"
    Message ||--o| Poll : "embeds"
    Message ||--o| Message : "replies to"

    User {
        ObjectId _id PK
        string name
        string phone UK
        string password
        string userType "farmer | provider | buyer"
        string village
        string district
        string bio
        string profileImage
        number farmingStartYear
        array landPlots
        array mainCrops
        string farmingStyle
        string preferredLanguage
        array blockedUsers FK
    }

    CropCycle {
        ObjectId _id PK
        ObjectId user FK
        string cropName
        number area
        date sowingDate
        string status "active | harvested | sold"
        number yieldQty
        number revenue
        array expenses
        boolean isListed
        number expectedPrice
        number quantityAvailable
        string description
    }

    Machine {
        ObjectId _id PK
        ObjectId user FK
        string name
        string type
        number price
        string priceUnit "hour | acre | day"
        string description
        boolean available
        string image
    }

    Booking {
        ObjectId _id PK
        ObjectId machine FK
        ObjectId farmer FK
        ObjectId provider FK
        date date
        string status "pending | confirmed | rejected | completed"
        string notes
    }

    WorkGroup {
        ObjectId _id PK
        string name
        string village
        array admins FK
        array members "Subdocuments"
        ObjectId createdBy FK
        string status "active | closed"
    }

    WorkRecord {
        ObjectId _id PK
        ObjectId group FK
        date date
        string landOwnerName
        boolean isInternalFarm
        ObjectId internalMemberId
        string crop
        string activityType
        number acres
        number ratePerAcre
        number additionalCharges
        number totalAmount
        array attendance "Member Subdoc IDs"
        number wagePerPerson
        array settledMembers
        string paymentStatus "PENDING | PARTIAL | SETTLED"
        ObjectId recordedBy FK
    }

    Settlement {
        ObjectId _id PK
        ObjectId group FK
        date date
        string settlementType "GROUP_WIDE | SELECTED_MEMBERS | NET_SETTLEMENT"
        number totalAmount
        array workRecordsIncluded FK
        array distributions "Subdocuments"
        string paymentMode "CASH | UPI | BANK_TRANSFER | OTHER"
        string notes
        string remarks
        ObjectId processedBy FK
    }

    Conversation {
        ObjectId _id PK
        boolean isGroup
        string groupName
        string groupIcon
        string village
        array participants FK
        array admins FK
        ObjectId latestMessage FK
        ObjectId pinnedMessage FK
    }

    Message {
        ObjectId _id PK
        ObjectId senderId FK
        string senderName
        string village
        ObjectId conversationId FK
        string text
        string image
        string audio
        string file
        string fileName
        string fileSize
        string fileType
        ObjectId poll FK
        ObjectId replyTo FK
        string replyText
        array starredBy FK
        array readBy FK
        array reactions
        array deletedBy FK
        boolean isDeleted
        boolean isPinned
    }

    Poll {
        ObjectId _id PK
        ObjectId creator FK
        string question
        array options
        boolean multipleChoice
        ObjectId conversationId FK
        date expiresAt
    }

    Post {
        ObjectId _id PK
        ObjectId user FK
        string title
        string content
        array replies
        number likes
    }

    Notification {
        ObjectId _id PK
        ObjectId user FK
        string title
        string message
        string type "GROUP_ADDED | WORK_RECORDED | SETTLEMENT | ..."
        boolean read
        ObjectId relatedId
    }

    AIChat {
        ObjectId _id PK
        ObjectId user FK
        string title
        array messages
    }

    MandiRate {
        ObjectId _id PK
        string market
        string crop
        string type
        number min
        number max
        number modal
        string trend "up | down | stable"
        date date
    }

    Scheme {
        ObjectId _id PK
        string name
        string provider
        string providerColor
        string amount
        string description
        string eligibility
        string applyDate
        string paymentDate
        string link
    }
```

### 5.2 Detailed Mongoose Schema Specifications

#### `User.js`
- **Purpose**: Central user authentication and profile model.
- **Fields**:
  - `name`: `String`, required. Full display name.
  - `phone`: `String`, required, unique index. Mobile phone number used for login.
  - `password`: `String`, required. Salted bcrypt hash.
  - `userType`: `String`, enum: `['farmer', 'provider', 'buyer']`, default: `'farmer'`.
  - `village`: `String`. Resident village name.
  - `district`: `String`. Administrative district (used for Mandi rates and weather matching).
  - `bio`: `String`, default: `""`. Personal summary.
  - `profileImage`: `String`, default: `""`. Profile photo URL or base64 string.
  - `farmingStartYear`: `Number`. Year the farmer commenced agricultural operations.
  - `landPlots`: `Array` of subdocuments:
    - `name`: `String`, default: `'Main Plot'`.
    - `size`: `Number` (in acres).
    - `soilType`: `String` (e.g., Red Sandy, Black Cotton).
    - `irrigationMethod`: `String` (e.g., Drip, Borewell, Canal).
  - `mainCrops`: `[String]`. Primary crops cultivated (e.g., Cotton, Paddy, Chilli).
  - `farmingStyle`: `String`, enum: `['organic', 'conventional', 'mixed', '']`, default: `''`.
  - `preferredLanguage`: `String`, default: `'en'`. Language code (`en`, `te`, `hi`).
  - `blockedUsers`: `[{ type: ObjectId, ref: 'User' }]`. Array of users blocked by this user.
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `AdminUser.js`
- **Purpose**: System administrator authentication credential.
- **Fields**:
  - `email`: `String`, required, unique index.
  - `password`: `String`, required. Bcrypt hashed password.
  - `name`: `String`, required.
  - `role`: `String`, default: `'superadmin'`.
  - `createdAt`: `Date`, default: `Date.now`.

#### `CropCycle.js`
- **Purpose**: Tracks individual crop sowing instances, production costs, and market sale visibility.
- **Fields**:
  - `user`: `ObjectId`, ref: `'User'`, required. Owner farmer.
  - `cropName`: `String`, required.
  - `area`: `Number`, required. Cultivated land area in acres.
  - `sowingDate`: `Date`, default: `Date.now`.
  - `status`: `String`, enum: `['active', 'harvested', 'sold']`, default: `'active'`.
  - `yieldQty`: `Number`, default: `0`. Harvested yield in quintals.
  - `revenue`: `Number`, default: `0`. Realized revenue in INR.
  - `expenses`: `Array` of embedded subdocuments:
    - `type`: `String` (e.g., Fertilizer, Seeds, Pesticide, Labor, Machinery).
    - `amount`: `Number`.
    - `date`: `Date`, default: `Date.now`.
    - Note: Mongoose automatically generates an `_id` on each expense subdocument.
  - `isListed`: `Boolean`, default: `false`. Whether the harvest is published to wholesale buyers.
  - `expectedPrice`: `Number`, default: `0`. Farmer's asking price per quintal.
  - `quantityAvailable`: `Number`, default: `0`. Available batch quantity in quintals.
  - `description`: `String`, default: `""`. Additional notes for buyers.
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `Machine.js`
- **Purpose**: Agricultural machinery listings available for rent.
- **Fields**:
  - `user`: `ObjectId`, ref: `'User'`, required. Provider/owner.
  - `name`: `String`, required. Equipment model name (e.g., "Mahindra 575 DI").
  - `type`: `String`, required. Category (e.g., "Tractor", "Harvester", "Drone", "Implements").
  - `price`: `Number`, required. Rental price.
  - `priceUnit`: `String`, enum: `['hour', 'acre', 'day']`, default: `'hour'`, required.
  - `description`: `String`. Specifications and implement attachments.
  - `available`: `Boolean`, default: `true`. Operational availability toggle.
  - `image`: `String`, default fallback placeholder URL.
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `Booking.js`
- **Purpose**: Reservations for equipment rental between farmers and machinery providers.
- **Fields**:
  - `machine`: `ObjectId`, ref: `'Machine'`, required.
  - `farmer`: `ObjectId`, ref: `'User'`, required.
  - `provider`: `ObjectId`, ref: `'User'`, required.
  - `date`: `Date`, required. Scheduled date of operation.
  - `status`: `String`, enum: `['pending', 'confirmed', 'rejected', 'completed']`, default: `'pending'`.
  - `notes`: `String`. Farmer operational notes (e.g., "Need for 3 hours paddy field puddling").
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `WorkGroup.js`
- **Purpose**: Labor collectives and worker groups.
- **Subdocument (`MemberSchema`)**:
  - `user`: `ObjectId`, ref: `'User'`, default: `null`. `null` indicates an offline/proxy member.
  - `name`: `String`, required. Member name.
  - `phone`: `String`, default: `''`.
  - `isOffline`: `Boolean`, default: `false`.
  - `role`: `String`, enum: `['member', 'admin', 'owner']`, default: `'member'`.
  - `status`: `String`, enum: `['active', 'removed']`, default: `'active'`.
  - `village`: `String`, default: `''`.
  - `notes`: `String`, default: `''`.
  - `joinedAt`: `Date`, default: `Date.now`.
- **Root Fields**:
  - `name`: `String`, required, trim. Group name.
  - `village`: `String`, trim. Group base location.
  - `admins`: `[{ type: ObjectId, ref: 'User' }]`. Group administrators.
  - `members`: `[MemberSchema]`. Array of member subdocuments.
  - `createdBy`: `ObjectId`, ref: `'User'`, required. Group founder/owner.
  - `status`: `String`, enum: `['active', 'closed']`, default: `'active'`.
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `WorkRecord.js`
- **Purpose**: A recorded day of farm labor by a collective.
- **Fields**:
  - `group`: `ObjectId`, ref: `'WorkGroup'`, required.
  - `date`: `Date`, required. Date work was performed.
  - `landOwnerName`: `String`, required. Farmer/Client whose land was worked.
  - `isInternalFarm`: `Boolean`, default: `false`. True if work was done on a group member's farm.
  - `internalMemberId`: `ObjectId`, optional. Member subdocument ID if `isInternalFarm` is true.
  - `crop`: `String`, required. Crop worked on (e.g., Chilli Picking, Cotton Weeding).
  - `activityType`: `String`, required. Activity description.
  - `acres`: `Number`, required. Extent of land worked.
  - `ratePerAcre`: `Number`, required. Agreed rate per acre.
  - `additionalCharges`: `Number`, default: `0`. Extra charges for transport or machinery.
  - `totalAmount`: `Number`, required. Math formula: `(acres * ratePerAcre) + additionalCharges`.
  - `attendance`: `[{ type: ObjectId }]`, required. Array of member `_id` subdocuments present.
  - `wagePerPerson`: `Number`, required. Math formula: `totalAmount / attendance.length`.
  - `settledMembers`: `[{ type: ObjectId }]`. Member IDs who have received payout for this day.
  - `paymentStatus`: `String`, enum: `['PENDING', 'PARTIAL', 'SETTLED']`, default: `'PENDING'`.
  - `recordedBy`: `ObjectId`, ref: `'User'`, required. User who logged the entry.
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `Settlement.js`
- **Purpose**: Payout transactions distributing collected earnings to group members.
- **Subdocument (`DistributionSchema`)**:
  - `memberId`: `ObjectId`, required. Target member subdocument `_id`.
  - `amountPaid`: `Number`, required. Payout amount in INR.
- **Root Fields**:
  - `group`: `ObjectId`, ref: `'WorkGroup'`, required.
  - `date`: `Date`, default: `Date.now`.
  - `settlementType`: `String`, enum: `['GROUP_WIDE', 'SELECTED_MEMBERS', 'NET_SETTLEMENT']`, required.
  - `totalAmount`: `Number`, required. Cumulative amount distributed.
  - `workRecordsIncluded`: `[{ type: ObjectId, ref: 'WorkRecord' }]`. Records settled by this payout.
  - `distributions`: `[DistributionSchema]`. Per-member payout breakdown.
  - `notes`: `String`.
  - `paymentMode`: `String`, enum: `['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']`, default: `'CASH'`.
  - `remarks`: `String`.
  - `processedBy`: `ObjectId`, ref: `'User'`, required. Admin who executed the settlement.
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `Conversation.js`
- **Purpose**: Chat threads for 1-on-1 direct messages, self-chat notes, and multi-user groups.
- **Fields**:
  - `isGroup`: `Boolean`, default: `false`.
  - `groupName`: `String`, default: `""`.
  - `groupIcon`: `String`, default: `""`. Uploaded group picture URL.
  - `village`: `String`, default: `""`. Legacy village association.
  - `participants`: `[{ type: ObjectId, ref: "User" }]`. All conversation members.
  - `admins`: `[{ type: ObjectId, ref: "User" }]`. Group chat administrators.
  - `latestMessage`: `ObjectId`, ref: `"Message"`, default: `null`.
  - `pinnedMessage`: `ObjectId`, ref: `"Message"`, default: `null`.
  - `createdAt`: `Date`, default: `Date.now`.
  - `updatedAt`: `Date`, default: `Date.now`.

#### `Message.js`
- **Purpose**: Individual messages exchanged within a `Conversation`.
- **Fields**:
  - `senderId`: `ObjectId`, ref: `"User"`. Author ID.
  - `senderName`: `String`, required. Cached sender name.
  - `village`: `String`. Sender village.
  - `conversationId`: `ObjectId`, ref: `"Conversation"`, required.
  - `text`: `String`. Message textual content.
  - `image`: `String`. Uploaded image URL.
  - `audio`: `String`. Uploaded voice recording URL.
  - `file`: `String`. Uploaded attachment document URL.
  - `fileName`, `fileSize`, `fileType`: `String`. Attachment metadata.
  - `poll`: `ObjectId`, ref: `"Poll"`. Reference to attached interactive poll.
  - `replyTo`: `ObjectId`, ref: `"Message"`, default: `null`. Quoted message ID.
  - `replyText`: `String`, default: `""`. Snapshot of quoted message text.
  - `starredBy`: `[{ type: ObjectId, ref: "User" }]`. Users who have starred this message.
  - `readBy`: `[{ type: ObjectId, ref: "User" }]`. Users who have opened and read this message.
  - `reactions`: `[{ user: ObjectId, emoji: String }]`. Array of user emoji reactions.
  - `deletedBy`: `[{ type: ObjectId, ref: "User" }]`. Users who executed "Delete for Me".
  - `isDeleted`: `Boolean`, default: `false`. True if soft-deleted for everyone ("This message was deleted").
  - `isPinned`: `Boolean`, default: `false`. True if pinned in conversation.
  - `createdAt`: `Date`, default: `Date.now`.

#### `Poll.js`
- **Purpose**: Interactive voting poll in chat conversations.
- **Fields**:
  - `creator`: `ObjectId`, ref: `"User"`, required.
  - `question`: `String`, required. Poll title/question.
  - `options`: `[{ text: String, votes: [{ type: ObjectId, ref: "User" }] }]`.
  - `multipleChoice`: `Boolean`, default: `false`. Allows selecting more than one option.
  - `conversationId`: `ObjectId`, ref: `"Conversation"`, required.
  - `createdAt`: `Date`, default: `Date.now`.
  - `expiresAt`: `Date`. Expiration timestamp.

#### `Post.js`
- **Purpose**: Community discussion forum questions and responses.
- **Fields**:
  - `user`: `ObjectId`, ref: `'User'`, required. Author.
  - `title`: `String`, required. Question topic.
  - `content`: `String`, required. Discussion body.
  - `replies`: `[{ user: ObjectId, name: String, text: String, createdAt: Date }]`. Embedded reply comments.
  - `likes`: `Number`, default: `0`.
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `Notification.js`
- **Purpose**: System and group notification feed for users.
- **Fields**:
  - `user`: `ObjectId`, ref: `'User'`, required. Recipient user.
  - `title`: `String`, required. Short title.
  - `message`: `String`, required. Detailed description.
  - `type`: `String`, enum: `['GROUP_ADDED', 'GROUP_REMOVED', 'GROUP_PROMOTED', 'WORK_RECORDED', 'SETTLEMENT', 'GROUP_CLOSED', 'INFO']`, default: `'INFO'`.
  - `read`: `Boolean`, default: `false`. Read status.
  - `relatedId`: `ObjectId`. Related entity (e.g. `groupId`, `settlementId`).
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

#### `AIChat.js`
- **Purpose**: Persistent GramSathi AI chat conversation threads.
- **Fields**:
  - `user`: `ObjectId`, ref: `"User"`, required. Owner user.
  - `title`: `String`, default: `"New Chat"`. Session title (auto-generated from first 30 chars of query).
  - `messages`: `Array` of subdocuments:
    - `sender`: `String`, enum: `['user', 'ai']`, required.
    - `text`: `String`, required.
    - `intent`: `String`, default: `""`. The detected intent key.
    - `structured_data`: `Mixed`, default: `{}`. Action parameters and navigation payload.
    - `timestamp`: `Date`, default: `Date.now`.
- **Timestamps**: `createdAt`, `updatedAt`.

#### `MandiRate.js`
- **Purpose**: Agricultural Produce Market Committee (APMC) daily wholesale commodity prices.
- **Fields**:
  - `market`: `String`, required. Market name (e.g. "Warangal", "Khammam", "Nizamabad").
  - `crop`: `String`, required. Commodity (e.g. "Cotton", "Paddy", "Chilli").
  - `type`: `String`, required. Variety / grade.
  - `min`: `Number`, required. Minimum price per quintal in INR.
  - `max`: `Number`, required. Maximum price per quintal in INR.
  - `modal`: `Number`, required. Modal / average trading price per quintal.
  - `trend`: `String`, enum: `["up", "down", "stable"]`, default: `"stable"`.
  - `date`: `Date`, default: `Date.now`.
- **Timestamps**: `createdAt`, `updatedAt`.

#### `Scheme.js`
- **Purpose**: Directory of government agricultural welfare schemes and subsidies.
- **Fields**:
  - `name`: `String`, required. Scheme name (e.g. "PM-Kisan Samman Nidhi").
  - `provider`: `String`, required. Governing authority (e.g. "Central Govt", "Telangana State Govt").
  - `providerColor`: `String`, default: `"bg-blue-100 text-blue-700"`. UI badge styling class.
  - `amount`: `String`, required. Financial disbursement summary (e.g. "₹6,000 / year").
  - `description`: `String`, required. Scheme benefits summary.
  - `eligibility`: `String`, required. Farmer landholding criteria.
  - `applyDate`: `String`, required. Application intake window.
  - `paymentDate`: `String`, required. Expected disbursement timeline.
  - `link`: `String`, required. Official portal URL.
- **Timestamps**: `createdAt`, `updatedAt`.

#### `UserRelations.js`
- **Purpose**: Secondary relational table managing blocked users and favorite chats.
- **Fields**:
  - `user`: `ObjectId`, ref: `"User"`, required, unique.
  - `blockedUsers`: `[{ type: ObjectId, ref: "User" }]`.
  - `favoriteChats`: `[{ type: ObjectId, ref: "Conversation" }]`.

### 5.3 Database Indexing, Garbage Collection & Migration Scripts

1. **Unique Indices**:
   - `User.phone`: Ensures strict single-account binding per telephone number.
   - `AdminUser.email`: Unique constraint on administrator emails.
   - `UserRelations.user`: Ensures 1:1 mapping between user and their relations document.
2. **Automated Garbage Collection in `bookingController.js`**:
   Whenever `/bookings/fetchall` is invoked, the controller runs a garbage collector:
   - Deletes all bookings with `status: 'rejected'` updated more than 30 days ago.
   - Deletes all bookings with `status: 'pending'` whose reservation date has expired by 30 days.
   - Deletes all historical bookings with `status: 'completed'` older than 365 days (1 year).
3. **Database Migration Scripts**:
   - `backend/migrate_chats.js`: Iterates over legacy `Message` documents tagged only with a `village` string, groups them by distinct village, instantiates corresponding `Conversation` documents with `isGroup: true`, and updates the messages with `conversationId`.
   - `backend/scripts/repairGroups.js`: Audits all `WorkGroup` documents in MongoDB. If a group creator is missing from the `members` array, it automatically looks up the `User` and synthesizes an `owner` member entry.

---

## 6. Complete Backend REST & WebSocket API Reference

### 6.1 Authentication & Profile APIs (`/auth`)

Mounted at `/auth` in `backend/index.js`. Defined in `backend/routes/authRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Query Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | None | `{ name, phone, password, userType, village, district }` | `201 Created`<br>`{ message, user: { id, name, phone, userType } }` | `400` User already exists<br>`500` Internal Server Error | Salts password with 10 bcrypt rounds. Creates `User`. |
| `POST` | `/auth/login` | None | `{ phone, password }` | `200 OK`<br>`{ message, token, user: { id, name, userType, village } }` | `404` User not found<br>`400` Invalid credentials | Signs 30-day JWT containing `{ id, userType }`. |
| `POST` | `/auth/getuser` | Yes (`auth-token`) | None | `200 OK`<br>`User` document (without password), populated `blockedUsers` | `401` Access Denied<br>`500` Server Error | Validates token via `fetchUser` middleware. |
| `PUT` | `/auth/updateprofile` | Yes (`auth-token`) | `{ name, village, district, bio, profileImage, farmingStartYear, landPlots, mainCrops, farmingStyle, preferredLanguage }` | `200 OK`<br>`{ success: true, user }` | `401` Unauthorized<br>`500` Server Error | Selectively updates provided fields on logged-in user. |
| `GET` | `/auth/members/:village` | Yes (`auth-token`) | Path: `village` | `200 OK`<br>`Array<User>` (name, phone, userType, profileImage, bio, village) | `500` Server Error | Retrieves members residing in the specified village. |
| `GET` | `/auth/profile-analytics` | Yes (`auth-token`) | None | `200 OK`<br>`{ activeCrops, completedCrops, expensesRecorded, forumPosts }` | `500` Server Error | Aggregates user crop counts, expense entries, and posts. |
| `GET` | `/auth/search-users` | Yes (`auth-token`) | Query: `?q=name` (min 2 chars) | `200 OK`<br>`Array<{ _id, name, profileImage, village }>` | `500` Server Error | Case-insensitive regex search on user names. |
| `POST` | `/auth/block/:id` | Yes (`auth-token`) | Path: `id` (target user ID) | `200 OK`<br>`{ success: true, blockedUsers }` | `400` Cannot block yourself<br>`500` Server Error | Adds target ID to `User.blockedUsers`. |
| `POST` | `/auth/unblock/:id` | Yes (`auth-token`) | Path: `id` (target user ID) | `200 OK`<br>`{ success: true, blockedUsers }` | `500` Server Error | Filters target ID out of `User.blockedUsers`. |
| `GET` | `/auth/blocked` | Yes (`auth-token`) | None | `200 OK`<br>`Array<User>` (populated blocked users) | `500` Server Error | Returns full profiles of blocked contacts. |

### 6.2 Crop & Market Listing APIs (`/crops`)

Mounted at `/crops` in `backend/index.js`. Defined in `backend/routes/cropRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/crops/add` | Yes (`auth-token`) | `{ cropName, area, sowingDate }` | `201 Created`<br>`CropCycle` object | `500` Server Error | Links new crop cycle to `req.user.id`. |
| `GET` | `/crops/fetchall` | Yes (`auth-token`) | None | `200 OK`<br>`Array<CropCycle>` sorted by newest | `500` Server Error | Fetches all crops belonging to logged-in user. |
| `GET` | `/crops/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`CropCycle` object | `404` Not Found<br>`401` Not Allowed | Ownership verification enforced. |
| `DELETE` | `/crops/delete/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ Success, crop }` | `404` Not Found<br>`401` Not Allowed | Deletes crop cycle if owned by `req.user.id`. |
| `PUT` | `/crops/expense/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ type, amount, date }` | `200 OK`<br>Updated `CropCycle` | `404` Not Found<br>`401` Not Allowed | Pushes new expense subdocument into `crop.expenses`. |
| `DELETE` | `/crops/expense/:id/:expenseId` | Yes (`auth-token`) | Path: `id`, `expenseId` | `200 OK`<br>`{ success: "Expense deleted" }` | `404` Not Found<br>`401` Not Allowed | Executes `$pull` on `crop.expenses` by `_id`. |
| `PUT` | `/crops/sell/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ yieldQty, revenue }` | `200 OK`<br>Updated `CropCycle` | `404` Not Found / Unauthorized | Updates `status: 'sold'`, stores realized yield and revenue. |
| `PUT` | `/crops/market/toggle/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ isListed, expectedPrice, quantityAvailable, description }` | `200 OK`<br>Updated `CropCycle` | `404` Crop not found | Publishes or unpublishes crop on buyer marketplace. |
| `GET` | `/crops/market/listings` | **Public** | None | `200 OK`<br>`Array<CropCycle>` with populated seller `user` | `500` Server Error | Finds all crops where `isListed: true`. |

### 6.3 Machinery & Equipment APIs (`/machines`)

Mounted at `/machines` in `backend/index.js`. Defined in `backend/routes/machineRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/machines/add` | Yes (`auth-token`) | `{ name, type, price, priceUnit, description, image }` | `201 Created`<br>`Machine` object | `500` Server Error | Creates machinery listing under provider `req.user.id`. |
| `GET` | `/machines/fetchall` | Yes (`auth-token`) | None | `200 OK`<br>`Array<Machine>` populated with owner info | `500` Server Error | Browsing catalog for farmers. |
| `GET` | `/machines/type/:type` | Yes (`auth-token`) | Path: `type` (e.g. Tractor) | `200 OK`<br>`Array<Machine>` matching category regex | `500` Server Error | Case-insensitive category search. |
| `GET` | `/machines/own` | Yes (`auth-token`) | None | `200 OK`<br>`Array<Machine>` owned by user | `500` Server Error | Fleet management view for providers. |
| `DELETE` | `/machines/delete/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: "Machine deleted successfully" }` | `404` Not Found<br>`401` Not Allowed | Enforces owner verification before deletion. |

### 6.4 Machinery Booking Lifecycle APIs (`/bookings`)

Mounted at `/bookings` in `backend/index.js`. Defined in `backend/routes/bookingRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/bookings/book` | Yes (`auth-token`) | `{ machineId, date, notes }` | `201 Created`<br>`Booking` object | `404` Machine not found<br>`400` Cannot book own machine | Sets `farmer: req.user.id`, `provider: machine.user`. |
| `GET` | `/bookings/fetchall` | Yes (`auth-token`) | None | `200 OK`<br>`Array<Booking>` populated with machine, farmer, provider | `500` Server Error | **Triggers Garbage Collector**: Auto-deletes rejected/expired bookings older than 30d and completed > 1y. |
| `PUT` | `/bookings/status/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ status }` ('confirmed'/'rejected') | `200 OK`<br>Updated `Booking` | `404` Not found<br>`401` Not Authorized (Provider only) | Only provider can change status. |
| `DELETE` | `/bookings/delete/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: "Booking deleted" }` | `404` Not Found<br>`401` Not Authorized | Either farmer or provider can delete. |

### 6.5 Labor Work Groups & Wage Settlements APIs (`/api/groups`)

Mounted at `/api/groups` in `backend/index.js`. Defined in `backend/routes/groupRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/groups` | Yes (`auth-token`) | `{ name, village }` | `201 Created`<br>`{ success: true, group }` | `500` Server Error | Instantiates group, adds creator as `role: 'owner'`. |
| `GET` | `/api/groups` | Yes (`auth-token`) | None | `200 OK`<br>`{ success: true, groups }` | `500` Server Error | Fetches groups where user is admin, member, or creator. |
| `GET` | `/api/groups/personal/dashboard` | Yes (`auth-token`) | None | `200 OK`<br>`{ success: true, data: { stats, groups } }` | `500` Server Error | Aggregates individual worker metrics: total earned, pending dues, days worked, attendance %. |
| `GET` | `/api/groups/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, group }` | `404` Group not found | Populates admins and member user references. |
| `PUT` | `/api/groups/:id/members` | Yes (`auth-token`) | Path: `id`<br>Body: `{ name, phone, village, notes, userId }` | `200 OK`<br>`{ success: true, group }` | `400` Member already exists<br>`500` Server Error | Resolves user by phone; marks `isOffline: true` if unfindable. Broadcasts `GROUP_ADDED` notification. |
| `PUT` | `/api/groups/:id/members/:memberId/role` | Yes (`auth-token`) | Path: `id`, `memberId`<br>Body: `{ role }` ('admin'/'member') | `200 OK`<br>`{ success: true, group }` | `403` Only owner can update roles | Updates member role and modifies `admins` array. |
| `DELETE` | `/api/groups/:id/members/:memberId` | Yes (`auth-token`) | Path: `id`, `memberId` | `200 OK`<br>`{ success: true, group }` | `403` Unauthorized<br>`400` Cannot remove owner | Sets member `status: 'removed'` (preserves historical wage records). |
| `PUT` | `/api/groups/:id/transfer-ownership` | Yes (`auth-token`) | Path: `id`<br>Body: `{ newOwnerId }` | `200 OK`<br>`{ success: true, group }` | `403` Only current owner | Sets new owner, demotes old owner to admin. |
| `PUT` | `/api/groups/:id/close` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, group }` | `403` Only owner | Sets `status: 'closed'`. Broadcasts notification. |
| `DELETE` | `/api/groups/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true }` | `403` Only owner | Permanently deletes group, work records, and settlements. |
| `POST` | `/api/groups/:id/work` | Yes (`auth-token`) | Path: `id`<br>Body: `{ date, landOwnerName, isInternalFarm, internalMemberId, crop, activityType, acres, ratePerAcre, additionalCharges, attendance }` | `201 Created`<br>`{ success: true, record }` | `500` Server Error | Computes `totalAmount` & `wagePerPerson`. Broadcasts `WORK_RECORDED` notification. |
| `GET` | `/api/groups/:id/work` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, records }` | `500` Server Error | Lists all work records for group, sorted by date desc. |
| `POST` | `/api/groups/:id/settlements` | Yes (`auth-token`) | Path: `id`<br>Body: `{ settlementType, totalAmount, workRecordsIncluded, distributions, notes }` | `201 Created`<br>`{ success: true, settlement }` | `500` Server Error | Updates `settledMembers` on work records, updates status (`PENDING` -> `PARTIAL` -> `SETTLED`). Broadcasts notification. |
| `GET` | `/api/groups/:id/settlements` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, settlements }` | `500` Server Error | Fetches settlement payout history with processor name. |
| `GET` | `/api/groups/:id/analytics` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, analytics: { totalEarnings, pendingPayments, totalAcres, totalWorkDays, memberStats } }` | `500` Server Error | Aggregates group performance and per-member pending/earned breakdown. |

### 6.6 Real-Time Messenger & Chat APIs (`/chat`)

Mounted at `/chat` in `backend/index.js`. Defined in `backend/routes/chatRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/chat/conversations` | Yes (`auth-token`) | None | `200 OK`<br>`Array<Conversation>` with populated participants & latestMessage | `500` Server Error | Fetches user's conversations, sorted by `updatedAt` desc. |
| `POST` | `/chat/conversations` | Yes (`auth-token`) | `{ participantIds, isGroup, groupName }` | `201 Created` / `200 OK`<br>`Conversation` object | `500` Server Error | Checks if 1-on-1 or self-chat already exists; returns existing or creates new. |
| `GET` | `/chat/messages/:conversationId` | Yes (`auth-token`) | Path: `conversationId` | `200 OK`<br>`Array<Message>` with populated poll | `500` Server Error | Excludes messages where `deletedBy` contains `req.user.id`. |
| `DELETE` | `/chat/clear/:conversationId` | Yes (`auth-token`) | Path: `conversationId` | `200 OK`<br>`{ success: true }` | `500` Server Error | Clears chat by deleting unstarred messages (`starredBy: { $size: 0 }`). |
| `PUT` | `/chat/star/:id` | Yes (`auth-token`) | Path: `id` (Message ID) | `200 OK`<br>Updated `Message` | `404` Not Found<br>`500` Server Error | Toggles `req.user.id` in `starredBy` array. |
| `PUT` | `/chat/react/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ emoji }` | `200 OK`<br>Updated `Message` | `500` Server Error | Replaces previous user reaction or adds new emoji. |
| `PUT` | `/chat/react/remove/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>Updated `Message` | `404` Not Found<br>`500` Server Error | Removes user emoji reaction. |
| `DELETE` | `/chat/delete/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, message }` | `401` Not Authorized<br>`404` Not Found | **Soft Delete for Everyone**: Sets `isDeleted: true`, text to "This message was deleted", clears reactions. |
| `PUT` | `/chat/delete-for-me` | Yes (`auth-token`) | Body: `{ messageIds }` | `200 OK`<br>`{ success: true, ids, mode: 'me' }` | `500` Server Error | Appends `req.user.id` to `deletedBy` array on targeted messages. |
| `POST` | `/chat/delete-multiple` | Yes (`auth-token`) | Body: `{ messageIds }` | `200 OK`<br>`{ success: true, ids }` | `500` Server Error | Hard deletes multiple messages sent by user. |
| `PUT` | `/chat/conversations/:conversationId/pin` | Yes (`auth-token`) | Path: `conversationId`<br>Body: `{ messageId }` | `200 OK`<br>Updated `Conversation` | `404` Not Found | Updates `pinnedMessage` pointer in conversation. |
| `POST` | `/chat/upload` | Yes (`auth-token`) | Multipart file (`upload.single("file")`) | `200 OK`<br>`{ fileUrl, fileName, fileSize, fileType }` | `400` No file<br>`500` Upload Error | Stores file in `backend/uploads/`. |
| `PUT` | `/chat/conversations/:id/icon` | Yes (`auth-token`) | Path: `id`<br>Multipart image | `200 OK`<br>Updated `Conversation` | `400` Not a group chat | Uploads group profile picture and updates `groupIcon`. |
| `POST` | `/chat/messages` | Yes (`auth-token`) | `{ conversationId, text }` | `201 Created`<br>`Message` object | `500` Server Error | REST endpoint for sending message (used by AI agent). |

### 6.7 Real-Time Sockets Protocol (`socket.io`)

Configured on the HTTP server in `backend/index.js`.

| Socket Event Name | Direction | Payload Structure | Handler Implementation & Side Effects |
| :--- | :--- | :--- | :--- |
| `join_conversation` | Client → Server | `{ conversationId, userId }` | Server executes `socket.join(conversationId)`. Updates unread messages: `$addToSet: { readBy: userId }`. Broadcasts `messages_read_update` to room. |
| `send_message` | Client → Server | `{ senderId, senderName, conversationId, village, text, image, audio, file, fileName, fileSize, fileType, poll, replyTo, replyText }` | Persists new `Message` document to MongoDB. Updates `Conversation.latestMessage`. Broadcasts `receive_message` with data to room. |
| `receive_message` | Server → Client | Full message object | Triggered when another participant sends a message. UI displays bubble. |
| `delete_message` | Client → Server | `{ messageId, conversationId }` | Broadcasts `message_deleted` with `messageId` to the conversation room. |
| `update_message` | Client → Server | `{ message, conversationId }` | Broadcasts `message_updated` with updated reactions/stars to the conversation room. |
| `vote_poll` | Client → Server | `{ pollId, optionIndex, userId, conversationId }` | Toggles user vote on option. Enforces single-choice constraint if `multipleChoice: false`. Saves `Poll`. Emits `poll_updated` to room. |
| `messages_read_update`| Server → Client | `{ userId, conversationId }` | Informs room that user has read unread messages (updates double blue ticks). |

### 6.8 Community Forum & Replies APIs (`/community`)

Mounted at `/community` in `backend/index.js`. Defined in `backend/routes/postRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/community/add` | Yes (`auth-token`) | `{ title, content }` | `201 Created`<br>`Post` object | `500` Server Error | Creates new forum topic under `req.user.id`. |
| `GET` | `/community/fetchall` | Yes (`auth-token`) | None | `200 OK`<br>`Array<Post>` sorted by newest | `500` Server Error | Populates author user (`name`, `village`, `profileImage`). |
| `POST` | `/community/reply/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ text }` | `200 OK`<br>Updated `Post` with new reply | `500` Server Error | Pushes reply object `{ user, name, text, createdAt }` to `post.replies`. |

### 6.9 In-Chat Polls APIs (`/poll`)

Mounted at `/poll` in `backend/index.js`. Defined in `backend/routes/pollRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/poll/create` | Yes (`auth-token`) | `{ question, options, multipleChoice, conversationId }` | `201 Created`<br>`Poll` object | `500` Server Error | Maps option strings into `{ text, votes: [] }` subdocuments. |
| `GET` | `/poll/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`Poll` object | `404` Poll not found | Returns poll question, options, and vote counts. |
| `PUT` | `/poll/vote/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ optionIndex }` | `200 OK`<br>Updated `Poll` | `404` Poll not found | Toggles vote; removes previous votes if `multipleChoice: false`. |

### 6.10 In-App Notifications APIs (`/api/notifications`)

Mounted at `/api/notifications` in `backend/index.js`. Defined in `backend/routes/notificationRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Yes (`auth-token`) | None | `200 OK`<br>`{ success: true, notifications }` | `500` Server Error | Returns last 50 notifications for logged-in user. |
| `PUT` | `/api/notifications/mark-all-read` | Yes (`auth-token`) | None | `200 OK`<br>`{ success: true }` | `500` Server Error | Updates `read: true` for all unread notifications of user. |
| `PUT` | `/api/notifications/:id/read` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, notification }` | `500` Server Error | Marks specific notification as read. |

### 6.11 GramSathi AI Backend Bridge APIs (`/api/ai`)

Mounted at `/api/ai` in `backend/index.js`. Defined in `backend/routes/aiRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/ai/chats` | Yes (`auth-token`) | None | `200 OK`<br>`Array<AIChat>` (title, createdAt, updatedAt) | `500` Server Error | Lists user's past AI conversational threads. |
| `POST` | `/api/ai/chats/new` | Yes (`auth-token`) | None | `201 Created`<br>`AIChat` object | `500` Server Error | Instantiates empty chat thread with title "New Chat". |
| `GET` | `/api/ai/chats/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`AIChat` document with messages array | `404` Chat not found | Retrieves full chat transcript for active session. |
| `PUT` | `/api/ai/chats/:id` | Yes (`auth-token`) | Path: `id`<br>Body: `{ title }` | `200 OK`<br>Updated `AIChat` | `400` Title required | Renames an existing chat session. |
| `DELETE` | `/api/ai/chats/:id` | Yes (`auth-token`) | Path: `id` | `200 OK`<br>`{ success: true, message }` | `404` Chat not found | Deletes AI chat session. |
| `POST` | `/api/ai/chat` | Yes (`auth-token`) | `{ session_id, message, current_page_context, language }` | `200 OK`<br>`{ reply, intent, structured_data, action, success }` | `500` Server Error | Proxies request to FastAPI with retry loop (15 retries / 75s cold start buffer). |
| `POST` | `/api/ai/voice` | Yes (`auth-token`) | Multipart file (`audio_file`) + form fields | `200 OK`<br>`{ reply, intent, structured_data, action }` | `500` Server Error | Proxies audio file to FastAPI `/api/ai/voice`. |
| `GET` | `/api/ai/messenger/conversations` | Yes (`auth-token`) | None | `200 OK`<br>`Array<{ id, type, name }>` | `500` Server Error | Messenger helper endpoint used by AI agent to resolve contact names. |
| `GET` | `/api/ai/messenger/conversation-by-name` | Yes (`auth-token`) | Query: `?name=&type=` | `200 OK`<br>`Array<{ id, type, name }>` | `500` Server Error | Fuzzy contact resolver used by `resolve_conversation`. |

### 6.12 SuperAdmin Portal APIs (`/admin`)

Mounted at `/admin` in `backend/index.js`. Defined in `backend/routes/adminRoutes.js`.

| Method | Endpoint | Auth Required | Request Body / Params | Success Response (Code) | Error Responses | Notes & Side Effects |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/admin/login` | None | `{ email, password }` | `200 OK`<br>`{ token, admin: { id, name, email, role } }` | `400` Invalid credentials | Verifies admin password, issues 24-hour admin JWT. |
| `POST` | `/admin/setup` | None | None | `201 Created`<br>`{ message: "Default admin created" }` | `403` Admin already exists | Creates default superadmin (`admin@agrispine.com` / `admin123`) if database is empty. |
| `POST` | `/admin/register` | None | `{ name, email, password }` | `201 Created`<br>`{ message: "Admin account created" }` | `400` All fields required / Admin exists | Registers new admin with `role: 'superadmin'`. |
| `POST` | `/admin/seed` | Yes (`admin-token`) | None | `200 OK`<br>`{ message: "Seed successful: Mandi Rates and Schemes initialized." }` | `401` No token<br>`403` Forbidden | Drops and seeds default Schemes (PM-Kisan, Rythu Bandhu, PMFBY) and Mandi Rates. |
| `GET` | `/admin/schemes` | **Public** | None | `200 OK`<br>`Array<Scheme>` | `500` Server Error | Returns list of government schemes. |
| `POST` | `/admin/schemes` | Yes (`admin-token`) | `{ name, provider, providerColor, amount, description, eligibility, applyDate, paymentDate, link }` | `201 Created`<br>`Scheme` object | `403` Forbidden | Creates new government welfare scheme. |
| `PUT` | `/admin/schemes/:id` | Yes (`admin-token`) | Path: `id`<br>Body: Scheme fields | `200 OK`<br>Updated `Scheme` | `403` Forbidden<br>`404` Not found | Updates scheme details. |
| `DELETE` | `/admin/schemes/:id` | Yes (`admin-token`) | Path: `id` | `200 OK`<br>`{ message: "Scheme deleted" }` | `403` Forbidden | Deletes scheme. |
| `GET` | `/admin/mandi-rates` | **Public** | None | `200 OK`<br>`Array<MandiRate>` | `500` Server Error | Returns APMC Mandi rates. |
| `POST` | `/admin/mandi-rates` | Yes (`admin-token`) | `{ market, crop, type, min, max, modal, trend }` | `201 Created`<br>`MandiRate` object | `403` Forbidden | Publishes new daily Mandi rate entry. |
| `PUT` | `/admin/mandi-rates/:id` | Yes (`admin-token`) | Path: `id`<br>Body: Mandi rate fields | `200 OK`<br>Updated `MandiRate` | `403` Forbidden | Updates Mandi price. |
| `DELETE` | `/admin/mandi-rates/:id` | Yes (`admin-token`) | Path: `id` | `200 OK`<br>`{ message: "Mandi Rate deleted" }` | `403` Forbidden | Deletes Mandi rate. |

---

## 7. Feature-by-Feature Technical Deep Dive

### 7.1 Authentication, Security & Role Access
- **Implementation Files**:
  - Backend: `backend/controllers/authController.js`, `backend/routes/authRoutes.js`, `backend/middlewares/fetchUser.js`.
  - Frontend: `frontend/src/pages/auth/Login.jsx`, `frontend/src/pages/auth/Register.jsx`, `frontend/src/utils/api.js`.
  - Mobile: `app/lib/features/auth/screens/login_screen.dart`, `app/lib/features/auth/providers/auth_provider.dart`.
- **Execution Mechanism**:
  1. Registration collects `phone`, `password`, `name`, `userType` (`farmer`, `provider`, `buyer`), `village`, and `district`.
  2. Passwords are encrypted using `bcrypt.genSalt(10)` and `bcrypt.hash()`.
  3. Upon login, `bcrypt.compare()` verifies the candidate password against the database hash. A JSON Web Token is signed via `jwt.sign({ id: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '30d' })`.
  4. The client caches the token in `localStorage.setItem('token', token)` and the user object in `localStorage.setItem('user', JSON.stringify(user))`.
  5. The Axios client interceptor (`frontend/src/utils/api.js`) automatically injects the `auth-token` header onto all outgoing HTTP requests.
  6. Backend middleware `fetchUser.js` intercepts private endpoints, executes `jwt.verify(token, JWT_SECRET)`, and sets `req.user = decodedToken`. If missing or invalid, it returns `401 Access Denied`.

### 7.2 Farmer Profiles & Agricultural Land Management
- **Implementation Files**:
  - Backend: `backend/controllers/authController.js` (`updateProfile`, `getUser`, `getProfileAnalytics`).
  - Frontend: `frontend/src/pages/core/Profile.jsx`, `frontend/src/pages/core/Dashboard.jsx`.
- **Execution Mechanism**:
  1. Allows farmers to configure multi-plot land holdings: `landPlots` array storing `name`, `size` (acres), `soilType`, and `irrigationMethod`.
  2. Farmers record their `farmingStartYear`, `mainCrops` tags (e.g. Cotton, Maize, Chilli), and `farmingStyle` (`organic`, `conventional`, `mixed`).
  3. The `getProfileAnalytics` endpoint calculates live metrics: active crops count, completed crop cycles, total expenses logged across all crops, and forum contributions.
  4. The profile includes safety controls: blocked users list with live unblock actions.

### 7.3 Crop Lifecycle & Financial Tracking
- **Implementation Files**:
  - Backend: `backend/models/CropCycle.js`, `backend/controllers/cropController.js`, `backend/routes/cropRoutes.js`.
  - Frontend: `frontend/src/pages/crops/AddCrop.jsx`, `frontend/src/pages/crops/CropDetails.jsx`, `frontend/src/pages/crops/MyCrops.jsx`, `frontend/src/pages/services/Reports.jsx`.
- **Execution Mechanism**:
  1. **Crop Registration**: Form in `AddCrop.jsx` sends `cropName`, `area` (acres), and `sowingDate` to `POST /crops/add`.
  2. **Expense Tracking**: Inside `CropDetails.jsx`, modal `ExpenseForm.jsx` sends `PUT /crops/expense/:id` with `{ type, amount, date }`. Mongoose pushes the subdocument to `expenses`.
  3. **Harvest & Sale**: When harvesting, farmer clicks "Mark as Sold", submitting yield quantity (quintals) and realized revenue (INR) to `PUT /crops/sell/:id`. The crop status transitions from `'active'` to `'sold'`.
  4. **Financial Formulas**:
     $$\text{Total Expenses} = \sum_{i=1}^{n} \text{expense}[i].\text{amount}$$
     $$\text{Net Profit} = \text{Revenue} - \text{Total Expenses}$$
     $$\text{Cost per Acre} = \frac{\text{Total Expenses}}{\text{Area}}$$
  5. **Data Visualization (`Reports.jsx`)**: Aggregates all user crops via `GET /crops/fetchall`, computes total investment and revenue, maps expenses into category buckets (`Fertilizer`, `Seeds`, `Labor`, `Machinery`, `Pesticide`), and renders interactive Recharts `BarChart` and `PieChart`.

### 7.4 Agricultural Equipment & Rental Machinery Engine
- **Implementation Files**:
  - Backend: `backend/models/Machine.js`, `backend/controllers/machineController.js`.
  - Frontend: `frontend/src/pages/rent-machinery/AddMachine.jsx`, `ManageMachine.jsx`, `MyMachines.jsx`, `RentCategories.jsx`, `RentDetails.jsx`, `RentListing.jsx`.
- **Execution Mechanism**:
  1. Machinery providers list equipment with name, category (`Tractor`, `Harvester`, `Drone`, `Implements`), rental rate, billing unit (`hour`, `acre`, `day`), implement description, and photo.
  2. Equipment discovery offers category browsing (`RentCategories.jsx`), listing filters (`RentListing.jsx`), and keyword search.
  3. Machine details (`RentDetails.jsx`) displays provider credentials, location, phone number, and rental terms.
  4. Providers manage fleet listings and toggle availability in `MyMachines.jsx`.

### 7.5 Machinery Booking Lifecycle & Garbage Collection
- **Implementation Files**:
  - Backend: `backend/models/Booking.js`, `backend/controllers/bookingController.js`.
  - Frontend: `frontend/src/pages/rent-machinery/MyBookings.jsx`, `RentDetails.jsx`.
- **Execution Mechanism**:
  1. **Booking Creation**: Farmer selects date and adds operational notes in `RentDetails.jsx`, issuing `POST /bookings/book` with `{ machineId, date, notes }`.
  2. **Security Check**: Backend blocks users from booking their own equipment (`machine.user === req.user.id`).
  3. **Provider Decision**: Provider views request in `MyBookings.jsx` / `MyMachines.jsx` and clicks Accept (`confirmed`) or Reject (`rejected`), triggering `PUT /bookings/status/:id`.
  4. **State Machine**:
     ```
     [Pending] ──── Provider Confirms ────► [Confirmed] ──── Work Done ────► [Completed]
         │
         ├──── Provider Rejects ───────► [Rejected] ──► (Auto-GC after 30d)
         │
         └──── Farmer / Owner Cancels ─► [Deleted]
     ```
  5. **Automated Garbage Collection**: Whenever any user visits `MyBookings.jsx`, `backend/controllers/bookingController.js` automatically purges:
     - Rejected bookings older than 30 days.
     - Pending requests whose target date passed more than 30 days ago.
     - Completed bookings older than 365 days.

### 7.6 Real-Time Messenger, Village Groups, Reactions & Polls
- **Implementation Files**:
  - Backend: `backend/index.js` (Socket.IO events), `backend/models/Conversation.js`, `Message.js`, `Poll.js`, `backend/controllers/chatController.js`, `pollController.js`.
  - Frontend: `frontend/src/pages/messages/Messenger.jsx` and `components/*`.
- **Execution Mechanism**:
  1. **Room Binding**: Upon opening a conversation, client emits `join_conversation` with `conversationId` and `userId`. Backend adds socket to room and executes `$addToSet: { readBy: userId }` on all unread messages.
  2. **Real-Time Transmission**: Sending a message emits `send_message` with text, attachments (image/audio/file), and reply context. The server persists the `Message` document to MongoDB, updates `Conversation.latestMessage`, and broadcasts `receive_message` to the room.
  3. **In-Chat Audio Notes**: User records voice clips in `MessageInput.jsx`; audio files are uploaded to `/chat/upload` and rendered as native HTML5 audio players in `MessageBubble.jsx`.
  4. **Camera Modal (`CameraModal.jsx`)**: Streams raw webcam video using `navigator.mediaDevices.getUserMedia`, captures snapshots to canvas, converts to Blob, and uploads as image messages.
  5. **Interactive Polls**:
     - Users launch `CreatePollModal.jsx`, specifying question and options.
     - Saved via `POST /poll/create`, linking `Message.poll`.
     - In chat, `MessageBubble.jsx` renders live option bars with percentage vote distributions.
     - Voting emits `vote_poll` over WebSockets; server toggles vote in `Poll.options[i].votes` and emits `poll_updated` to all participants.
  6. **Reactions & Quoting**: Users react with emojis (saved in `Message.reactions`). Replies quote previous messages (`replyTo`, `replyText`).
  7. **Message Pinning & Star Management**: Pinned messages update `Conversation.pinnedMessage` and stick to the chat header. Starred messages persist during chat clearing.
  8. **Deletion Policies**:
     - *Soft Delete for Everyone*: Sets `isDeleted: true`, replaces text with "This message was deleted", removes reactions.
     - *Delete for Me*: Adds user ID to `Message.deletedBy`; excluded from future queries for that user.

### 7.7 Labor Work Groups, Daily Wage Calculations & Settlement Engine
- **Implementation Files**:
  - Backend: `backend/models/WorkGroup.js`, `WorkRecord.js`, `Settlement.js`, `backend/services/groupService.js`, `backend/controllers/groupController.js`.
  - Frontend: `frontend/src/pages/groups/*` (Dual-mode Admin/Member dashboards).
- **Execution Mechanism**:
  1. **Group Creation & Member Registry**:
     - Group creator becomes `role: 'owner'` and primary admin.
     - Members can be registered online users (matched via phone number) or **offline proxy members** (`isOffline: true`) for rural workers without smartphones.
  2. **Dual-Mode UI Architecture**:
     - Owners and admins see a toggle in `GroupDetails.jsx` switching between **Admin View** and **Member View**.
     - Regular members only see the **Member View**.
  3. **Daily Farm Work Recording (`RecordWorkModal.jsx`)**:
     - Admin selects date, landowner name, crop, activity type (e.g. Cotton Picking, Paddy Sowing), acreage, rate per acre, and extra charges.
     - Admin marks attendance via an interactive checklist of group member subdocuments.
     - **Exact Wage Formula Implemented in `groupService.js`**:
       $$\text{Total Amount} = (\text{acres} \times \text{ratePerAcre}) + \text{additionalCharges}$$
       $$\text{Wage Per Person} = \frac{\text{Total Amount}}{\text{attendance.length}}$$
     - Submitting creates a `WorkRecord` with `paymentStatus: 'PENDING'` and broadcasts a `WORK_RECORDED` in-app notification to all members.
  4. **Internal Farm Work Owed Tracking**:
     - If work was performed on a member's own farm (`isInternalFarm: true`), that member is marked as owing the collective `totalAmount`.
  5. **Settlement & Payout Engine (`SettlementManagement.jsx`)**:
     - Supports three settlement types: `GROUP_WIDE` (all members settled), `SELECTED_MEMBERS` (individual worker payouts), and `NET_SETTLEMENT`.
     - Admin selects work records and enters member distribution amounts.
     - `processSettlementService` loops over included work records, appends settled worker IDs to `record.settledMembers`, and updates status:
       - If `settledMembers.length === 0`: `paymentStatus = 'PENDING'`
       - If `settledMembers.length < attendance.length`: `paymentStatus = 'PARTIAL'`
       - If `settledMembers.length >= attendance.length`: `paymentStatus = 'SETTLED'`
     - Generates a `Settlement` record with payment mode (`CASH`, `UPI`, `BANK_TRANSFER`) and broadcasts `SETTLEMENT` notification.
  6. **Report Generation & Export (`ReportExport.js`)**:
     - Generates formatted PDF reports via `jsPDF` and `jspdf-autotable`.
     - Exports structured spreadsheets via `xlsx` (`XLSX.utils.json_to_sheet`).

### 7.8 Buyer-Seller Marketplace (Direct Farm-to-Buyer)
- **Implementation Files**:
  - Backend: `backend/models/CropCycle.js` (`isListed`, `expectedPrice`, `quantityAvailable`), `backend/controllers/cropController.js`.
  - Frontend: `frontend/src/pages/market/BuyerMarket.jsx`, `frontend/src/pages/crops/CropDetails.jsx`.
- **Execution Mechanism**:
  1. Farmer toggles "List on Market" in `CropDetails.jsx`, setting available quantity (quintals), minimum asking price, and quality description.
  2. Wholesale buyers access `BuyerMarket.jsx` which calls `GET /crops/market/listings` (public endpoint).
  3. Listings populate seller name, village, district, and contact telephone number.
  4. Buyers can search by crop name or filter by district to source produce directly from farm gates.

### 7.9 Mandi Rates & Market Price Discovery
- **Implementation Files**:
  - Backend: `backend/models/MandiRate.js`, `backend/controllers/adminController.js`.
  - Frontend: `frontend/src/pages/market/MarketPrices.jsx`, `admin/src/pages/admin/AdminMandiRates.jsx`.
- **Execution Mechanism**:
  1. Mandi prices are published by SuperAdmins through `AdminMandiRates.jsx`.
  2. Farmers access `MarketPrices.jsx` which displays commodities, markets (e.g. Warangal, Nizamabad, Guntur), min/max prices, modal price, and trend indicators (`up`, `down`, `stable`).
  3. Includes district filtering and live search.

### 7.10 Government Schemes Directory
- **Implementation Files**:
  - Backend: `backend/models/Scheme.js`, `backend/controllers/adminController.js`.
  - Frontend: `frontend/src/pages/services/Schemes.jsx`, `admin/src/pages/admin/AdminSchemes.jsx`.
- **Execution Mechanism**:
  1. Curated database of central and state government agricultural subsidies (PM-Kisan, Rythu Bandhu, PMFBY Insurance, Tractor Subsidies).
  2. Displays disbursement amounts, eligibility requirements, application periods, and direct outbound links to government application portals.

### 7.11 Community Forum & Knowledge Exchange
- **Implementation Files**:
  - Backend: `backend/models/Post.js`, `backend/controllers/postController.js`.
  - Frontend: `frontend/src/pages/community/Community.jsx`, `components/NewPostForm.jsx`, `components/PostCard.jsx`.
- **Execution Mechanism**:
  1. Farmers post questions regarding pest infestations, crop diseases, or market rates via `NewPostForm.jsx`.
  2. Posts are listed with author name, village, timestamp, and like counter.
  3. Community members post replies directly nested within the post document (`post.replies`).
  4. Tab filters allow toggling between "All Questions", "My Questions", and "My Replies".

### 7.12 Agricultural Weather & Micro-Forecasts
- **Implementation Files**:
  - Frontend: `frontend/src/pages/core/Weather.jsx`, `frontend/src/pages/core/Dashboard.jsx`.
  - AI: `ai/core/agents/weather_agent.py`.
- **Execution Mechanism**:
  1. Reads user's registered `district` from `localStorage.getItem('user')` (defaults to "Hyderabad").
  2. Queries OpenWeatherMap 2.5 Current Weather and 5-Day / 3-Hour Forecast APIs using API key `35e669987b8f3f982e649b224ed22c0c`.
  3. Displays current temperature, humidity, wind velocity, feels-like temperature, and sunrise/sunset times.
  4. Visualizes hourly temperature and precipitation probability trends using Recharts `AreaChart` and `LineChart`.

### 7.13 Plant Doctor Disease Diagnosis (Demo / Mocked AI)
- **Implementation Files**:
  - Frontend: `frontend/src/pages/services/PlantDoctor.jsx`.
  - Mobile: `app/lib/features/plant_doctor/screens/plant_doctor_screen.dart`.
- **Execution Status**: **Mocked / AI Demo Simulation**.
- **Execution Mechanism**:
  1. Farmer uploads a leaf photo or takes a picture.
  2. The frontend uploads the image to Cloudinary CDN (`https://api.cloudinary.com/v1_1/dv2ex5war/image/upload`, preset: `agrispine_upload`).
  3. After a 2500ms delay simulating model inference, the component randomly selects a disease diagnosis from an in-memory client array:
     - `Early Blight` (92% confidence, fungicide remedy)
     - `Leaf Spot` (88% confidence, neem oil remedy)
     - `Powdery Mildew` (95% confidence, sulfur fungicide remedy)
     - `Healthy Plant` (99% confidence, regular care)
  4. Displays severity badge, confidence percentage, and recommended treatment.

### 7.14 Localization (i18n) & Dynamic Language Switching
- **Implementation Files**:
  - Frontend: `frontend/src/i18n.js`, `frontend/src/components/LanguageSwitcher.jsx`, `frontend/public/locales/{en,te,hi}/translation.json`.
- **Execution Mechanism**:
  1. Configured via `i18next`, `react-i18next`, `i18next-http-backend`, and `i18next-browser-languagedetector`.
  2. Supported Languages: English (`en`), Telugu (`te`), Hindi (`hi`).
  3. Translations are loaded over HTTP from `/locales/{{lng}}/translation.json`.
  4. Selected language code is persisted in `localStorage` under `i18nextLng`.
  5. When changed in `LanguageSwitcher.jsx`, the switcher calls `i18n.changeLanguage(code)` followed by `window.location.reload()` to flush all component states and AI contexts.
  6. The language code is forwarded to GramSathi AI (`language: 'te'`), enforcing natural language AI responses in the chosen tongue.

### 7.15 Theme Management (Light / Dark Mode)
- **Implementation Files**:
  - Frontend: `frontend/src/contexts/ThemeContext.jsx`, `frontend/src/components/ThemeToggle.jsx`.
  - Admin: `admin/src/components/ThemeToggle.jsx`.
- **Execution Mechanism**:
  1. `ThemeContext` checks `localStorage.getItem('theme')` or system preference (`prefers-color-scheme: dark`).
  2. Toggles the `dark` class on `document.documentElement` (`<html>` element).
  3. Persists user preference across browser sessions.

### 7.16 SuperAdmin Dashboard & Platform Moderation
- **Implementation Files**:
  - Admin Portal: `admin/src/App.jsx`, `admin/src/pages/admin/*`.
  - Backend: `backend/controllers/adminController.js`, `backend/routes/adminRoutes.js`.
- **Execution Mechanism**:
  1. SuperAdmin authenticates at `/login` on port 5174, receiving an `admin-token`.
  2. Can trigger "Seed Default Data" calling `/admin/seed` to initialize APMC Mandi rates and government schemes.
  3. Full CRUD operations over `Scheme` and `MandiRate` collections.
  4. Pages for User Management, Groups, Polls, Announcements, and Events are current UI placeholders ("coming soon").

---

## 8. GramSathi AI Multi-Agent Architecture

### 8.1 Agent System Philosophy & Router Pattern

GramSathi AI is an autonomous, natural-language multi-agent microservice that converts conversational user statements into structured database operations.

Rather than relying on fragile regex matching or complex multi-turn prompt chains, GramSathi uses a **Single-Pass Router Pattern with JSON Schema Enforcement**:
1. The user's input prompt, conversation history, user profile context, and current page URL are bundled into a comprehensive system prompt.
2. An open-source LLM performs intent classification and parameter extraction in a single pass.
3. The extracted JSON payload is validated using Pydantic.
4. The system routes the extracted parameters to a dedicated Python agent worker in `TASK_REGISTRY`.
5. The worker executes business logic, resolves entity names via fuzzy matching, and issues HTTP mutations back to the Node.js backend.

### 8.2 Intent Classification & Fallback Models

Implemented in `ai/core/engines/huggingface.py`.

The system connects to HuggingFace Serverless Inference via `huggingface-hub.InferenceClient`. To protect against free-tier rate limits or model downtime, it implements an automated multi-model fallback chain:

```
Priority 1: Qwen/Qwen2.5-Coder-32B-Instruct
     │ (Fallback on HTTP error / rate limit)
     ▼
Priority 2: meta-llama/Llama-3.2-3B-Instruct
     │ (Fallback on error)
     ▼
Priority 3: HuggingFaceH4/zephyr-7b-beta
     │ (Fallback on error)
     ▼
Priority 4: mistralai/Mistral-7B-Instruct-v0.3
```

- **Hyperparameters**: `temperature = 0.1` (low temperature to guarantee deterministic, strict JSON output).
- **JSON Parser**: `_extract_json()` strips markdown code blocks (````json ... ````), extracts bracketed boundaries (`{ ... }`), parses via `json.loads()`, and validates against the Pydantic model:
  ```python
  class IntentClassification(BaseModel):
      intent: str
      parameters: Dict[str, Any] = {}
      chat_reply: Optional[str] = None
  ```

### 8.3 Prompt Engineering & System Context Injection

Implemented in `ai/prompts/system_prompts.py` (`build_system_prompt`).

Variables dynamically injected into each LLM invocation:
1. `registry_keys`: List of all registered intent actions (`CROP_ADD`, `CROP_ADD_EXPENSE`, `MACHINERY_BOOK`, etc.) plus `CHAT`.
2. `user_context`: User profile JSON fetched from MongoDB (name, village, district, land plots, farming style, crops count, machines count).
3. `page_context`: Current frontend URL path (e.g. `{ "path": "/crop/67b..." }`), enabling contextual inference.
4. `language`: Target output language (`en` -> English, `te` -> Telugu, `hi` -> Hindi).

**System Prompt Rules Enforced**:
- *Conversational Memory*: LLM must resolve anaphoric references from conversation history (e.g. "Add 500 fertilizer expense for it" following discussion of "Paddy" extracts `cropName = "Paddy"`).
- *Strict Intent Mapping*: Must select an intent from `AVAILABLE INTENTS`.
- *Chat Fallback*: If conversational or informational, sets `intent = "CHAT"` and populates `chat_reply`.
- *Mandatory Language Translation*: The `chat_reply` must be generated in the requested language (Telugu, Hindi, or English).

### 8.4 Task Registry & Specialized Agent Workers

Implemented in `ai/core/task_registry.py`.

The `TASK_REGISTRY` dictionary maps intent strings to specialized agent functions:

```python
TASK_REGISTRY = {
    # Crop Operations
    "CROP_ADD": execute_add_crop,
    "CROP_UPDATE": execute_update_crop,
    "CROP_DELETE": execute_delete_crop,
    "CROP_OPEN": execute_open_crop,
    "CROP_SELL": execute_sell_crop,
    
    # Expense Operations
    "CROP_ADD_EXPENSE": execute_add_expense,
    "CROP_DELETE_EXPENSE": execute_delete_expense,
    
    # Machinery Operations
    "MACHINERY_SEARCH": execute_search_machinery,
    "MACHINERY_OPEN": execute_open_machinery,
    "MACHINERY_BOOK": execute_book_machinery,
    "MACHINERY_CANCEL_BOOKING": execute_cancel_booking,
    
    # Messenger Operations
    "MESSENGER_SEND": execute_messenger_send,
    "MESSENGER_OPEN": execute_messenger_open,
    "MESSENGER_CLEAR_CHAT": execute_clear_chat,
    
    # Community & Polls
    "COMMUNITY_CREATE_POST": execute_create_post,
    "COMMUNITY_REPLY_POST": execute_reply_post,
    "POLL_CREATE": execute_create_poll,
    "POLL_VOTE": execute_vote_poll,
    
    # Market Operations
    "MARKET_TOGGLE_LISTING": execute_market_toggle_listing,
    "MARKET_VIEW_LISTINGS": execute_market_view_listings,
    
    # Weather & Navigation
    "WEATHER_GET": execute_get_weather,
    "NAVIGATE": execute_navigate,
    
    # Labor Work Groups
    "GROUP_CREATE": execute_group_create,
    "GROUP_ADD_MEMBER": execute_group_add_member,
    "GROUP_RECORD_WORK": execute_group_record_work,
    "GROUP_MARK_ATTENDANCE": execute_group_mark_attendance,
    "GROUP_SHOW_EARNINGS": execute_group_show_earnings,
    "GROUP_SETTLEMENT": execute_group_settlement
}
```

### 8.5 Context Resolution & Smart Fuzzy Matching

Implemented in `ai/core/smart_matcher.py` and `ai/core/context_resolver.py`.

Farmers rarely provide exact MongoDB ObjectIds. Instead, they say *"Add expense to Maize"* or *"Message Ramesh"*.

The **Smart Matcher** implements fuzzy string matching using Python's `difflib.SequenceMatcher`:
1. Normalizes strings: converts to lowercase, strips punctuation, normalizes whitespace.
2. Computes similarity ratio against candidate entities retrieved from the backend.
3. Sets a **90% confidence threshold** (`threshold = 0.90`).
4. **Disambiguation**: If multiple matches score above the threshold within a 0.05 margin, the matcher returns `multiple: True`, prompting the agent to ask the user: *"I found multiple crops matching 'Cotton': Cotton Plot A, Cotton Plot B. Which one did you mean?"*

### 8.6 Reverse Route Registry & UI Action Dispatch

Implemented in `ai/core/route_registry.py`.

When an agent completes an operation, it returns an `action` payload instruct the frontend:
```json
{
  "intent": "CROP_ADD",
  "reply": "Crop added successfully.",
  "action": {
    "intent": "NAVIGATE",
    "path": "/crop/67b5e4f1a2..."
  }
}
```

The frontend (`GramSathiFullScreen.jsx`) listens for action intents:
- `NAVIGATE`: Executes `setTimeout(() => navigate(action.path), 1500)`.
- `REFRESH_UI`: Executes `setTimeout(() => window.location.reload(), 2000)`.

### 8.7 Voice Input & Audio Processing Pipeline

1. **Frontend Speech Recognition**:
   - Implemented via browser-native Web Speech API (`window.webkitSpeechRecognition`).
   - Configured with `continuous = true` and `interimResults = true`.
   - Locale is set via `localStorage.getItem('i18nextLng')` (e.g. `te-IN`, `hi-IN`, `en-IN`).
   - Live transcription stream updates the text input state.
2. **Backend / FastAPI Voice Route**:
   - `ai/router/voice.py` provides an alternative server-side voice endpoint (`POST /api/ai/voice`) receiving multipart `.wav` audio.
   - Decodes audio using Python's `SpeechRecognition` library (`r.recognize_google(audio, language=language)`) and pipes the transcribed text into `process_request`.
3. **Text-to-Speech (TTS) Speech Synthesis**:
   - GramSathi speaks responses aloud using `window.speechSynthesis`.
   - Breaks long answers into sentence chunks to prevent browser speech buffer truncation.
   - Configured with Indian English / local dialect voicing (`en-IN`), with play, pause, resume, and replay controls.

### 8.8 Cold Start Mitigation & Resilience Strategies

Render free tier instances enter sleep mode after 15 minutes of inactivity. Cold starts can require 50+ seconds.

To prevent frontend timeouts:
- In `backend/services/aiService.js`, `forwardToFastAPI` implements an automated retry loop:
  - **15 retries** with **5-second backoff delays** (total 75-second buffer).
  - Listens specifically for `ECONNRESET`, `ECONNABORTED`, `ETIMEDOUT`, `502 Bad Gateway`, `503 Service Unavailable`, and `504 Gateway Timeout`.
  - If the AI service fails after all retries, the backend returns a friendly degradation response: *"The AI service is temporarily unavailable or restarting. Please try again in a few moments."*

---

## 9. End-to-End Execution Workflows

### 9.1 User Onboarding & Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer / User
    participant UI as React UI (Register.jsx)
    participant API as Express API (/auth/register)
    participant BC as Bcrypt Engine
    participant DB as MongoDB Atlas (User)
    participant JWT as JWT Engine

    Farmer->>UI: Enters Name, Phone, Password, Village, District
    UI->>API: POST /auth/register
    API->>DB: User.findOne({ phone })
    alt Phone Already Exists
        DB-->>API: User document found
        API-->>UI: 400 "User already exists with this phone number"
        UI-->>Farmer: Displays error alert
    else Phone is Available
        API->>BC: bcrypt.hash(password, 10)
        BC-->>API: Hashed password
        API->>DB: new User({ ... }).save()
        DB-->>API: Saved User document
        API-->>UI: 201 Created { user: { id, name, phone, userType } }
        UI->>UI: Redirects to /login
        Farmer->>UI: Enters Phone & Password
        UI->>API: POST /auth/login
        API->>DB: User.findOne({ phone })
        API->>BC: bcrypt.compare(password, user.password)
        BC-->>API: Valid match
        API->>JWT: jwt.sign({ id, userType }, JWT_SECRET, { expiresIn: '30d' })
        JWT-->>API: Signed JWT Token
        API-->>UI: 200 OK { token, user }
        UI->>UI: localStorage.setItem('token', token)
        UI->>UI: localStorage.setItem('user', JSON.stringify(user))
        UI-->>Farmer: Redirects to /dashboard
    end
```

### 9.2 Machinery Booking Request & Approval Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer (Renter)
    participant UI as React UI (RentDetails.jsx)
    participant API as Express API (/bookings)
    participant DB as MongoDB Atlas
    actor Provider as Equipment Provider

    Farmer->>UI: Selects date & notes -> Clicks "Confirm Booking"
    UI->>API: POST /bookings/book (machineId, date, notes) [auth-token]
    API->>DB: Machine.findById(machineId)
    alt Farmer owns machine
        API-->>UI: 400 "You cannot book your own machine"
    else Legitimate Rental
        API->>DB: new Booking({ machine, farmer, provider, date, notes, status: 'pending' }).save()
        DB-->>API: Saved Booking
        API-->>UI: 201 Created (Booking object)
        UI-->>Farmer: Success popup -> Navigates to /my-bookings
    end

    Note over Provider, API: Provider checks fleet bookings
    Provider->>API: GET /bookings/fetchall [Provider auth-token]
    API->>DB: Booking.deleteMany() [Auto-GC of expired rejected/pending]
    API->>DB: Booking.find({ $or: [{farmer}, {provider}] })
    DB-->>API: Active bookings
    API-->>Provider: Returns bookings array
    Provider->>API: PUT /bookings/status/:id { status: 'confirmed' }
    API->>DB: Booking.findById(id)
    alt Caller is not Provider
        API-->>Provider: 401 "Not Authorized to update this booking"
    else Valid Provider
        API->>DB: booking.status = 'confirmed'; booking.save()
        API-->>Provider: 200 OK (Updated booking)
    end
```

### 9.3 Labor Work Recording & Partial Settlement Execution

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Work Group Admin
    participant UI as RecordWorkModal.jsx
    participant API as Express API (/api/groups)
    participant SRV as groupService.js
    participant DB as MongoDB Atlas
    participant NOTIF as notificationHelper.js

    Admin->>UI: Enters Date, Landowner, Crop, Acres (5), Rate (1000), Attendees (10 workers)
    UI->>UI: Calculates Total (₹5,000) & Wage/Person (₹500)
    Admin->>UI: Submits Form
    UI->>API: POST /api/groups/:id/work
    API->>SRV: createWorkRecordService(groupId, payload, userId)
    SRV->>DB: new WorkRecord({ totalAmount: 5000, wagePerPerson: 500, attendance: [...] }).save()
    SRV->>NOTIF: sendGroupNotification(group, "Work Recorded", ...)
    NOTIF->>DB: Notification.create() for all members
    API-->>UI: 201 Created (WorkRecord)

    Note over Admin, API: Settlement Phase
    Admin->>UI: Selects Record -> Selects 4 members for cash payment -> Clicks Settle
    UI->>API: POST /api/groups/:id/settlements
    API->>SRV: processSettlementService(groupId, settlementPayload, userId)
    SRV->>DB: WorkRecord.find({ _id: { $in: records } })
    SRV->>SRV: Appends 4 member IDs to record.settledMembers
    SRV->>SRV: 4 < 10 attendees -> record.paymentStatus = 'PARTIAL'
    SRV->>DB: record.save()
    SRV->>DB: new Settlement({ totalAmount: 2000, distributions: [...] }).save()
    SRV->>NOTIF: sendGroupNotification(group, "Settlement Processed", ...)
    API-->>UI: 201 Created (Settlement)
```

### 9.4 Voice-Driven Crop Addition via GramSathi AI

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer
    participant UI as GramSathiFullScreen.jsx
    participant Node as Express API (/api/ai/chat)
    participant SRV as aiService.js
    participant Fast as FastAPI (engine.py)
    participant LLM as HuggingFace (Qwen2.5)
    participant Agent as crop_agent.py
    participant DB as MongoDB Atlas

    Farmer->>UI: Clicks Mic & Speaks: "Add a crop Cotton 3 acres sown today"
    UI->>UI: Web Speech API transcribes voice to text
    Farmer->>UI: Clicks Send
    UI->>Node: POST /api/ai/chat { session_id, message, current_page_context, language: 'en' }
    Node->>SRV: getUserContext(req.user.id)
    SRV->>DB: Queries user plots & active crops
    DB-->>SRV: User context object
    Node->>Fast: POST /chat { message, user_context, page_context, auth_token }
    Fast->>LLM: InferenceClient.chat_completion(SystemPrompt + History + Message)
    LLM-->>Fast: JSON: { "intent": "CROP_ADD", "parameters": { "cropName": "Cotton", "area": 3 } }
    Fast->>Fast: Task registry matches "CROP_ADD" -> execute_add_crop()
    Fast->>Agent: execute_add_crop(params, context)
    Agent->>Node: Outbound POST /crops/add { cropName: "Cotton", area: 3 } [auth-token]
    Node->>DB: new CropCycle({ ... }).save()
    DB-->>Node: Saved CropCycle (id: 67b...)
    Node-->>Agent: 201 Created { _id: "67b..." }
    Agent-->>Fast: { success: true, message: "Crop added.", action: { intent: "NAVIGATE", path: "/crop/67b..." } }
    Fast-->>Node: 200 OK (ChatResponse)
    Node->>DB: Appends AI response to AIChat.messages
    Node-->>UI: 200 OK { reply: "Crop added.", action: { path: "/crop/67b..." } }
    UI->>UI: window.speechSynthesis speaks "Crop added."
    UI->>UI: setTimeout -> navigate("/crop/67b...")
```

### 9.5 Real-Time Poll Creation and Voting in Chat

```mermaid
sequenceDiagram
    autonumber
    actor MemberA as Chat Member A (Creator)
    participant UI_A as Messenger UI
    participant API as Express API (/poll/create)
    participant WS as Socket.IO Server
    participant DB as MongoDB Atlas
    actor MemberB as Chat Member B (Voter)
    participant UI_B as Messenger UI

    MemberA->>UI_A: Enters Question ("Harvest on Friday?") & Options ("Yes", "No")
    UI_A->>API: POST /poll/create { question, options, conversationId }
    API->>DB: new Poll({ creator, question, options: [{text, votes:[]}], conversationId }).save()
    DB-->>API: Saved Poll
    API-->>UI_A: 201 Created (Poll object)
    UI_A->>WS: socket.emit("send_message", { poll: poll._id, conversationId, ... })
    WS->>DB: new Message({ poll: poll._id, ... }).save()
    WS->>UI_B: socket.emit("receive_message", messageWithPoll)
    UI_B->>UI_B: MessageBubble renders Poll Cards with vote buttons

    MemberB->>UI_B: Clicks "Yes" (Option Index 0)
    UI_B->>WS: socket.emit("vote_poll", { pollId, optionIndex: 0, userId, conversationId })
    WS->>DB: Poll.findById(pollId)
    WS->>WS: Toggles user ID in poll.options[0].votes
    WS->>DB: poll.save()
    WS-->>UI_A: socket.emit("poll_updated", poll)
    WS-->>UI_B: socket.emit("poll_updated", poll)
    UI_A->>UI_A: Re-renders percentage bars live (100% Yes)
    UI_B->>UI_B: Re-renders percentage bars live (100% Yes)
```

---

## 10. Flutter Mobile Application Architecture (`app/`)

### 10.1 State Management (Riverpod) & Networking (Dio)
- **Riverpod Architecture**: The mobile app uses `flutter_riverpod` (v3.3.2) with a top-level `ProviderScope`.
  - `authProvider`: Manages authentication state, token storage via `flutter_secure_storage`, and user profile data.
  - `communityProvider`, `machineryProvider`, `marketProvider`, `chatProvider`, `schemesProvider`: Manage remote feature fetching and local caching.
- **Networking Engine (`dio_client.dart`)**:
  - Encapsulates `Dio` with a base URL pointing to the Node.js backend.
  - Interceptors automatically retrieve the JWT token from `FlutterSecureStorage` and inject the `auth-token` header onto all outgoing requests.
  - Handles token expiration and auto-logout transitions.

### 10.2 Navigation & GoRouter Shell Route Architecture
- **Router Configuration (`app_router.dart`)**:
  - Uses `go_router` (v17.3.0) with an `initialLocation: '/dashboard'`.
  - **Redirect Guard**: If `!isAuth && location != '/login'`, redirects to `/login`. If `isAuth && location == '/login'`, redirects to `/dashboard`.
  - **StatefulShellRoute (Bottom Navigation)**: Uses `StatefulShellRoute.indexedStack` with 5 persistent tab branches:
    1. `/dashboard` (`DashboardScreen`)
    2. `/market` (`MarketScreen`)
    3. `/schemes` (`SchemesScreen`)
    4. `/community` (`CommunityScreen` with child route `/community/details`)
    5. `/profile` (`ProfileScreen` with child route `/profile/edit`)
  - **Full-Screen Pushed Routes**:
    - `/login`: Standalone login screen.
    - `/doctor`: Standalone Plant Doctor camera scanner.
    - `/messenger`: Conversation list screen.
    - `/chat/:id`: Real-time chat room window.
    - `/machinery`: Machinery equipment catalog.
    - `/machinery/:id`: Machine details view.
    - `/community/create`: Forum post authoring screen.

### 10.3 Mobile Feature Set & Parity Analysis

| Feature Area | Flutter Mobile Parity | Implementation Screen / Provider |
| :--- | :--- | :--- |
| **Authentication** | Full Parity | `login_screen.dart`, `register_screen.dart`, `auth_provider.dart` |
| **Dashboard** | Full Parity | `dashboard_screen.dart`, weather widgets, quick actions |
| **Machinery Rental** | Full Parity | `machinery_screen.dart`, `machine_details_screen.dart` |
| **Real-Time Messenger** | Full Parity | `messenger_screen.dart`, `chat_window_screen.dart`, `socket_provider.dart` |
| **Community Forum** | Full Parity | `community_screen.dart`, `create_post_screen.dart`, `post_details_screen.dart` |
| **Mandi Market Rates** | Full Parity | `market_screen.dart`, `market_provider.dart` |
| **Government Schemes**| Full Parity | `schemes_screen.dart`, `schemes_provider.dart` |
| **Plant Doctor** | UI Parity | `plant_doctor_screen.dart` (camera integration) |
| **Labor Work Groups** | **Missing on Mobile**| Not present in Flutter codebase; available exclusively on Web SPA. |
| **GramSathi FullScreen**| **Missing on Mobile**| Not present in Flutter router; available exclusively on Web SPA. |

---

## 11. Security, Authorization & Validation Architecture

### 11.1 Password Hashing & JWT Verification
- Passwords are encrypted before database insertion using `bcryptjs` with **10 salt rounds** (`bcrypt.genSalt(10)`). Plaintext passwords are never logged or stored.
- Password comparison uses timing-safe `bcrypt.compare()`.
- JWT tokens are signed using the HMAC SHA-256 algorithm with a secret key loaded from `process.env.JWT_SECRET`. Tokens expire after 30 days for farmers (`expiresIn: "30d"`) and 24 hours for administrators (`expiresIn: "24h"`).
- Token verification in `fetchUser.js` decodes claims (`req.user = decodedToken`). If verification fails (expired or forged signature), it aborts with HTTP `401 Access Denied`.

### 11.2 Role-Based Access Control (RBAC)
- **SuperAdmin Routes (`backend/routes/adminRoutes.js`)**:
  - Enforced by `adminAuth` middleware.
  - Requires the `admin-token` HTTP header.
  - Validates that `verified.role === "superadmin"`. Unauthorized requests receive HTTP `403 Forbidden`.
- **Machinery Management**:
  - Deleting a machine listing (`DELETE /machines/delete/:id`) verifies that `machine.user.toString() === req.user.id`.
  - Updating booking status (`PUT /bookings/status/:id`) verifies that `booking.provider.toString() === req.user.id`.
- **Labor Work Groups**:
  - Updating member roles (`updateMemberRoleService`), closing groups (`closeGroupService`), and deleting groups (`deleteGroupService`) strictly enforce `group.createdBy.toString() === userId.toString()` (Owner only).
  - Removing members allows group admins and owners, but explicitly prohibits removing the owner (`member.user === group.createdBy`).

### 11.3 File Upload Security & Multer Configuration
- Configured in `backend/middlewares/uploadMiddleware.js`.
- Restricts upload destinations to local filesystem directory `backend/uploads/`.
- File naming applies unique timestamps and random numbers (`Date.now() + '-' + Math.round(Math.random() * 1e9) + ext`) to prevent filesystem collision attacks and directory traversal.
- Served statically via `express.static(path.join(__dirname, 'uploads'))`.

### 11.4 User Privacy, Safety & User Blocking System
- Implemented in `authController.js` (`blockUser`, `unblockUser`, `getBlockedUsers`).
- Users can block offending accounts by ID.
- In `chatController.js`, users who delete messages "for me" have their user ID added to `Message.deletedBy`. When messages are queried (`getConversationMessages`), an exclusion filter `{ deletedBy: { $ne: req.user.id } }` guarantees that deleted content is hidden from that user while remaining intact for other participants.

---

## 12. Environment Setup & Local Execution Guide

### 12.1 Prerequisites & System Requirements
- **Node.js**: v20.x or v22.x LTS
- **Python**: v3.10.x, v3.11.x, or v3.12.x
- **Flutter SDK**: v3.12+ (Dart SDK 3.12+)
- **MongoDB**: Active MongoDB Atlas cluster URI or local MongoDB daemon running on port 27017
- **Git**: Installed and available in terminal

### 12.2 Backend Node.js Server Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file with required variables:
# PORT=5000
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/agrispine
# JWT_SECRET=your_jwt_secret_key_here
# AI_SERVICE_URL=http://localhost:8000

# 4. Start backend server in development mode (hot reload)
npm run dev
# Server will listen on http://localhost:5000
```

### 12.3 Frontend React Client Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file:
# VITE_API_BASE_URL=http://localhost:5000
# VITE_WEATHER_API_KEY=35e669987b8f3f982e649b224ed22c0c

# 4. Start frontend Vite dev server
npm run dev
# Application will launch on http://localhost:5173
```

### 12.4 Admin React Portal Setup
```bash
# 1. Navigate to admin directory
cd admin

# 2. Install dependencies
npm install

# 3. Create .env file:
# VITE_API_BASE_URL=http://localhost:5000

# 4. Start admin dev server
npm run dev
# Admin dashboard will launch on http://localhost:5174
```

### 12.5 AI FastAPI Microservice Setup
```bash
# 1. Navigate to ai directory
cd ai

# 2. Create and activate a Python virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create .env file:
# HUGGINGFACEHUB_API_TOKEN=hf_your_actual_token_here
# BACKEND_URL=http://localhost:5000

# 5. Start FastAPI application
python main.py
# Uvicorn will listen on http://localhost:8000
```

### 12.6 Flutter Mobile App Setup
```bash
# 1. Navigate to app directory
cd app

# 2. Install Flutter packages
flutter pub get

# 3. Run on connected emulator or physical device
flutter run
```

---

## 13. Current Implementation Status & Verification Matrix

### 13.1 Production-Ready Features
- **User Authentication**: Registration, phone/password login, JWT generation, password encryption, profile updates, language preference.
- **Crop Cycle Management**: Crop creation, listing, expense tracking, deletion, harvest/sale recording.
- **Equipment Sharing & Rental**: Machinery registration, hourly/daily/acre pricing, category filtering, booking request creation, provider acceptance/rejection, automated garbage collection.
- **Labor Work Groups**: Creation, member addition (online & offline proxies), role updates, daily work logging, acreage/piece-rate wage calculation, partial/full settlements, analytics dashboard, PDF and Excel export.
- **Real-Time Messenger**: Socket.IO room messaging, voice notes, attachments, camera snapshot capture, emoji reactions, message starring, pinned messages, soft deletion, and interactive single/multi-choice polls.
- **Mandi Rates & Schemes CRUD**: APMC market rates browsing, SuperAdmin publishing, government schemes directory.
- **Community Forum**: Thread creation, nested replies, author village display.
- **Multilingual Support**: Dynamic switching between English, Telugu, and Hindi across major screens.
- **Light/Dark Themes**: Persistent theme switching.

### 13.2 Partially Implemented / Demo Features
- **Plant Doctor (`PlantDoctor.jsx`)**: Cloudinary photo upload is functional, but leaf disease diagnosis uses a client-side mock simulation with a 2.5-second timer.
- **Weather (`Weather.jsx`)**: Connects to live OpenWeatherMap API, but depends on an in-code API key that may experience rate limits.

### 13.3 Mocked & Placeholder Features
- **Admin Users Management (`AdminUsers.jsx`)**: Returns static text: *"User management functionality coming soon."*
- **Admin Groups Management (`AdminGroups.jsx`)**: Returns static text: *"Group management functionality coming soon."*
- **Admin Polls Management (`AdminPolls.jsx`)**: Returns static text: *"Polls management functionality coming soon."*
- **Admin Announcements (`AdminAnnouncements.jsx`)**: Placeholder UI.
- **Admin Events (`AdminEvents.jsx`)**: Placeholder UI.
- **Admin Metrics (`AdminDashboard.jsx`)**: Hardcoded total users (`1,248`) and active schemes (`12`), though the "Seed Default Data" button is functional.

### 13.4 Planned or Missing Features
- **Native Payment Gateway Integration**: UPI and Bank Transfer settlements in WorkGroup and machinery rentals currently record transactions as internal ledger entries without Razorpay, Stripe, or Cashfree integration.
- **Mobile Parity for Labor Groups**: The Flutter mobile app does not currently include screens for WorkGroup ledgers or wage settlements.
- **Mobile GramSathi AI**: GramSathi conversational assistant is currently available on the Web SPA only.
- **Real Leaf Disease Model**: Integration with a trained Vision Transformer (ViT) or TensorFlow Lite model for genuine plant pathology.

---

## 14. Known Issues, Bugs & Code Discrepancies

### 14.1 Confirmed Code Bugs & Route Mismatches

1. **Machinery Route Mismatch in AI Context Resolver**:
   - *File*: `ai/core/context_resolver.py` (Line 62)
   - *Buggy Code*: `make_request("GET", "/machinery/fetchall", auth_token)`
   - *Observed Evidence*: In `backend/index.js`, the route is mounted at `app.use("/machines", machineRoutes)`. There is no `/machinery` prefix in the Express router.
   - *Impact*: When a user asks GramSathi AI to resolve a machine by name, the request fails with a 404 error, preventing the AI from finding machines.
   - *Remedy*: Update the endpoint in `context_resolver.py` to `/machines/fetchall`.

2. **Machinery Booking Route Parameter Discrepancy**:
   - *Files*: `ai/core/agents/machinery_agent.py` (Line 46-52) vs `backend/controllers/bookingController.js` (Line 7)
   - *Observed Evidence*: `machinery_agent.py` sends `{ "machineryId": machine_id, "startDate": ..., "endDate": ..., "totalPrice": ... }`. However, `bookingController.js` expects `{ "machineId": ..., "date": ..., "notes": ... }`.
   - *Impact*: When GramSathi AI attempts to book machinery on behalf of a user, the backend returns a 404 error because `req.body.machineId` is undefined.
   - *Remedy*: Align `machinery_agent.py` payload keys with `bookingController.js`.

3. **Missing `title` in AI Community Post Creation**:
   - *Files*: `ai/core/agents/community_agent.py` (Line 9) vs `backend/controllers/postController.js` (Line 8)
   - *Observed Evidence*: `community_agent.py` sends `{"content": content}`. However, `postController.js` extracts `{ title, content }` and `Post.js` defines `title` with `required: true`.
   - *Impact*: When GramSathi AI attempts to create a community post, Mongoose throws a schema validation error for the missing `title`.
   - *Remedy*: In `community_agent.py`, derive a default title (e.g. first 40 characters of content) or update the intent schema to extract `title`.

### 14.2 AI Agent Parameter Mismatches
- **Group Operations in AI**:
  - In `ai/core/agents/group_agent.py`, functions `execute_group_add_member`, `execute_group_record_work`, and `execute_group_mark_attendance` return fallback messages directing the user to navigate to `/groups` rather than executing direct API calls, because group IDs are not dynamically resolved in the agent.

### 14.3 Frontend-to-Backend Contract Discrepancies
- **Hindi Translation Overlay Bug**:
  - *Observed Evidence*: As noted in architectural reviews, `frontend/public/locales/hi/translation.json` historically had keys accidentally populated with Telugu strings during batch translation. Telugu and English files remain fully accurate.

### 14.4 Architectural & Scalability Bottlenecks
- **Socket.IO Single-Instance Memory Store**:
  - `backend/index.js` uses the default in-memory Socket.IO adapter. If the Node.js backend is scaled horizontally across multiple cluster instances or container replicas, socket room broadcasts will not reach clients on different nodes without a Redis adapter (`@socket.io/redis-adapter`).
- **Cold Start Latency on Free Tier**:
  - Because both backend and AI microservices are hosted on Render free tier, cold starts after 15 minutes of inactivity can cause 50–70 second initial response delays. The backend retry loop mitigates request drops, but first-time user response latency remains high.

---

## 15. Recommended Improvements & Future Roadmap

1. **Fix Discovered Code Mismatches**:
   - Correct `/machinery/fetchall` to `/machines/fetchall` in `ai/core/context_resolver.py`.
   - Align `machineryId` -> `machineId` and date parameters in `ai/core/agents/machinery_agent.py`.
   - Supply `title` parameter in `ai/core/agents/community_agent.py`.
2. **Implement Production Payment Gateway**:
   - Integrate Razorpay / Cashfree SDKs for UPI payments in machinery rentals and daily wage payouts.
3. **Connect Real Computer Vision Model to Plant Doctor**:
   - Replace the Cloudinary demo simulation with a TensorFlow Lite / ONNX model trained on the PlantVillage dataset for genuine crop disease detection.
4. **Horizontal Socket Scaling**:
   - Introduce Redis Adapter for Socket.IO to support multi-instance cluster deployment.
5. **Mobile Feature Parity**:
   - Port the Labor WorkGroup ledger and GramSathi AI assistant to the Flutter mobile application.
6. **Automated Unit & Integration Test Suite**:
   - Introduce Jest/Supertest for backend REST endpoint testing, React Testing Library for frontend components, and Pytest for the AI task engine.

---

## 16. Completeness Verification & Sign-Off

### 16.1 Component Coverage Verification

| Component / Subsystem | Verification Status | Source Files Audited |
| :--- | :--- | :--- |
| **Backend Core** | 100% Complete | `backend/index.js`, 11 routes, 11 controllers, 17 models, 2 services, 2 middlewares |
| **Frontend Web SPA** | 100% Complete | `frontend/src/App.jsx`, 28 pages, layouts, contexts, utilities, i18n locales |
| **Admin Web Portal** | 100% Complete | `admin/src/App.jsx`, 11 pages, layouts, api utilities |
| **GramSathi AI Service**| 100% Complete | `ai/main.py`, router, schemas, 8 agents, smart matcher, route registry, engines |
| **Flutter Mobile App** | 100% Complete | `app/lib/main.dart`, router, theme, network, all 8 feature directories |

### 16.2 Documentation Sign-Off
This document represents an exhaustive, technically rigorous, and verified architectural reference of the existing AgriSpine project codebase. All file references, schema attributes, formulas, API routes, and operational workflows have been validated against the actual source code.

