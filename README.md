# 🎫 SupportFlow — Customer Ticket Management System

[![System Status](https://img.shields.io/badge/Status-Active%20Development-004ac6?style=for-the-badge&logo=statuspage&logoColor=white)](file:///c:/DevOps/Ticket_Flow_System/README.md)
[![DevOps Ready](https://img.shields.io/badge/DevOps-CI%2FCD%20%26%20Docker%20Ready-3e3fcc?style=for-the-badge&logo=docker&logoColor=white)](file:///c:/DevOps/Ticket_Flow_System/README.md)
[![Design System](https://img.shields.io/badge/Design-SupportFlow%20Precision%20Enterprise-2563eb?style=for-the-badge)](file:///c:/DevOps/Ticket_Flow_System/supportflow_precision_enterprise/DESIGN.md)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Full--Stack-515f74?style=for-the-badge)](file:///c:/DevOps/Ticket_Flow_System/README.md)

**SupportFlow** is a full-stack, web-based enterprise customer support ticket management system designed for high-density operations, strict SLA enforcement, and automated triage. It bridges customer incident reporting with internal organization workflows while serving as a comprehensive, modular **DevOps learning project**.

---

## 📌 Table of Contents

1. [System Overview](#-system-overview)
2. [Dual-Role Portals & Feature Matrix](#-dual-role-portals--feature-matrix)
   - [Customer Portal](#1-customer-portal)
   - [Organization / Admin Portal](#2-organization--admin-portal)
3. [Ticket Lifecycle & SLA Engine](#-ticket-lifecycle--sla-engine)
4. [Data Model & Ticket Schema](#-data-model--ticket-schema)
5. [Audit Trail & Activity Timeline](#-audit-trail--activity-timeline)
6. [Operational Admin Dashboard & Analytics](#-operational-admin-dashboard--analytics)
7. [UI Design System & Existing Prototypes](#-ui-design-system--existing-prototypes)
8. [Target Technical Architecture](#-target-technical-architecture)
9. [DevOps Workflow & Learning Goals](#-devops-workflow--learning-goals)
10. [Development Roadmap & MVP Scope](#-development-roadmap--mvp-scope)
11. [Current Repository Directory Structure](#-current-repository-directory-structure)
12. [How to Run & Preview UI Prototypes](#-how-to-run--preview-ui-prototypes)

---

## 🌐 System Overview

SupportFlow provides a centralized platform for customer service operations:
* **Customers** can easily raise tickets, track progress in real time, upload attachments, communicate through conversational threads, and confirm resolutions.
* **Organization Staff & Admins** can dispatch, assign, prioritize, review internal notes, enforce Service Level Agreements (SLAs), and escalate overdue incidents.
* **DevOps Focus**: The application is structured into decoupled modules to support modern engineering practices: feature branching, automated CI testing, Docker containerization, Jenkins pipelines, and deployment monitoring.

---

## 👥 Dual-Role Portals & Feature Matrix

The system separates privileges into two core user roles:

```
                  ┌─────────────────────────────────────────┐
                  │          SupportFlow Platform           │
                  └────────────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│    Customer Portal    │                             │  Admin / Staff Desk   │
├───────────────────────┤                             ├───────────────────────┤
│ • Secure Auth / SSO   │                             │ • Master Queue Triage │
│ • Create Tickets      │                             │ • Ticket Assignment   │
│ • File Attachments    │                             │ • Public & Team Notes │
│ • Status Timeline     │                             │ • SLA Clock & Escalate│
│ • Public Discussion   │                             │ • Operational Metrics │
│ • Customer Resolution │                             │ • Audit Trail Logs    │
└───────────────────────┘                             └───────────────────────┘
```

### 1. Customer Portal
* **Registration & Secure Login**: Sign up, secure login, password management, and corporate SSO integration.
* **Ticket Submission**: Create support requests specifying Subject, Category, Description, and Priority.
* **Attachment Support**: Upload screenshots, log files, and documents to support ticket triage.
* **Personal Ticket Hub**: Filter and search across all raised tickets with real-time status pills.
* **Interactive Ticket Details**: View the full timeline, assigned department/agent, and SLA milestones.
* **Two-Way Communication**: Post replies and receive real-time notification alerts on status transitions.
* **Resolution Confirmation**: Explicitly confirm issue resolution and close the ticket.

### 2. Organization / Admin Portal
* **Administrative Authentication**: Role-based access control (RBAC) for agents, technical leads, and administrators.
* **Master Ticket Queue**: Triage desk with search (`⌘K` / `Ctrl+K`), custom filtering (Unassigned, Critical, Escalated, Overdue).
* **Workload Assignment**: Assign or reassign tickets to specific support agents or engineering queues.
* **Lifecycle State Transitions**: Update statuses (`In Progress`, `Pending Customer`, `Resolved`, `Closed`).
* **Dual-Channel Messaging**:
  * *Public Replies*: Visible to the customer and internal team.
  * *Internal Team Notes*: Private amber-styled notes (`#fffbeb`) visible exclusively to staff.
* **SLA Configuration & Countdown**: Enforce deadlines, monitor at-risk thresholds, and flag breaches.
* **One-Click Escalation**: Automatically elevate priority, notify supervisors, reassign, and record audit entries.
* **Full Audit Inspection**: Chronological timeline of every ticket change.

---

## 🔄 Ticket Lifecycle & SLA Engine

### The Lifecycle Flow
```
Customer Creates Ticket
         │
         ▼
     [ Open ] ──────────────► [ Assigned ]
                                    │
                                    ▼
                             [ In Progress ] ◄──────┐
                                    │               │ Public
                                    ▼               │ Clarification
                           [ Pending Customer ] ────┘
                                    │
                                    ▼
                              [ Resolved ]
                                    │
                                    ▼
                                [ Closed ]
```
*(At any stage prior to closure, a ticket approaching or exceeding SLA can transition into **Escalated** status).*

### Status Definitions
| Status | Semantic Color | Description |
| :--- | :--- | :--- |
| **Open** | `#3b82f6` (Blue) | Newly logged incident waiting for triage or assignment |
| **Assigned** | `#004ac6` (Royal Blue) | Allocated to an agent/team queue, pending initial review |
| **In Progress** | `#6366f1` (Indigo) | Active investigation or engineering work underway |
| **Pending Customer** | `#f59e0b` (Amber) | Awaiting customer verification, credentials, or logs |
| **Resolved** | `#10b981` (Emerald) | Fix delivered; awaiting customer closure confirmation |
| **Closed** | `#64748b` (Slate) | Confirmed resolved and formally archived |
| **Escalated** | `#ef4444` (Red) | SLA breach or critical escalation requiring supervisor triage |

### SLA State Detection
* 🟢 **Safe**: Ticket resolution time > 2 hours remaining.
* 🟡 **At Risk**: Less than 30–120 minutes remaining until SLA breach.
* 🔴 **Overdue / Breached**: Resolution deadline passed without resolution.
* ⚡ **Escalation Protocol**:
  1. Priority bumped automatically or manually to `High` / `Critical`.
  2. Ticket reallocated to escalation response leads.
  3. Status changed to `Escalated`.
  4. Immutable event logged to the ticket history.

---

## 🗄️ Data Model & Ticket Schema

### Core Ticket Entity
```json
{
  "ticketId": "SF-8488",
  "subject": "Webhook payload signature verification failing",
  "description": "Production HMAC-SHA256 headers are failing after rotating security keys.",
  "category": "API & Webhooks",
  "priority": "Critical",
  "status": "In Progress",
  "customer": {
    "id": "usr_9410",
    "name": "Sarah Jenkins",
    "email": "sarah@acme.com",
    "company": "Acme Corp"
  },
  "assignedEmployee": {
    "id": "emp_0211",
    "name": "Marcus Vance",
    "role": "L3 Platform Engineer"
  },
  "sla": {
    "deadline": "2026-09-15T12:30:00Z",
    "state": "At Risk",
    "minutesRemaining": 18
  },
  "attachments": [
    { "name": "payload_dump.json", "size": "42KB", "url": "/uploads/payload_dump.json" }
  ],
  "createdAt": "2026-09-15T10:12:00Z",
  "updatedAt": "2026-09-15T11:42:00Z"
}
```

---

## 📜 Audit Trail & Activity Timeline

Every mutation across a ticket's life generates an immutable audit record:

| Field | Description |
| :--- | :--- |
| **Event ID** | Unique timestamp-backed identifier |
| **Action** | `CREATED`, `ASSIGNED`, `STATUS_CHANGED`, `PRIORITY_BUMPED`, `INTERNAL_NOTE`, `SLA_EXTENDED`, `ESCALATED`, `RESOLVED` |
| **User Responsible** | Agent, Admin, Customer, or `SYSTEM_SLA_DAEMON` |
| **Previous Value & New Value** | e.g. `status: "Open" -> "In Progress"` |
| **Timestamp** | ISO-8601 UTC timestamp |

---

## 📊 Operational Admin Dashboard & Analytics

The Admin Dashboard provides instantaneous operational awareness through:
* **Metric Stat Cards**:
  * Total Tickets, Open Tickets, In Progress, Pending Customer, Resolved, Closed.
  * Real-time warning counters: **SLA At Risk** and **Escalated Queue**.
* **Visual Data Breakdowns**:
  * Tickets segmented by **Status** and **Priority**.
  * Volume by **Category** (Billing, API/Integration, Account, Infrastructure, Bugs).
  * Creation & Resolution Trends over time.
  * SLA Compliance Ratio (`% resolved within deadline`).

---

## 🎨 UI Design System & Existing Prototypes

The project implements the **SupportFlow Precision Enterprise** design system detailed in [`DESIGN.md`](file:///c:/DevOps/Ticket_Flow_System/supportflow_precision_enterprise/DESIGN.md).

### Design Highlights
* **Clean Clinical Canvas**: Slate-50 background (`#faf8ff`) with elevated white cards (`#ffffff`).
* **High-Contrast Typography**:
  * Headline & Body: **Inter** (11px Label SM to 32px Headline XL).
  * Monospace Elements: **JetBrains Mono** for Ticket IDs (`#SF-8488`), SLA countdowns, and keyboard shortcuts (`⌘K`).
  * Tabular numerals (`font-variant-numeric: tabular-nums`) preventing layout shifting during timer ticks.
* **Elevation Hierarchy**: Elevation 0 (Canvas) to Elevation 3 (Modals and Dialog overlays).
* **Responsive Breakpoints**:
  * Desktop (≥1280px): 3-pane split (Navigation, Queue Stream, Stage & Details).
  * Tablet (768px–1279px): 2-pane collapsible view.
  * Mobile (<768px): 1-pane sequential view with safe-area spacing.

---

## 🏗️ Target Technical Architecture

```
                       ┌─────────────────────────┐
                       │   Client Web Browser    │
                       │   HTML5 / TailwindCSS   │
                       │   Vanilla JavaScript    │
                       └────────────┬────────────┘
                                    │ HTTP / REST APIs
                                    ▼
                       ┌─────────────────────────┐
                       │     REST API Backend    │
                       │ (Node.js / Python / Go) │
                       │ - Authentication (JWT)  │
                       │ - Ticket Service        │
                       │ - SLA Monitoring Worker │
                       │ - File Upload Handler   │
                       └────────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │ Relational Database  │        │  Local / S3 Storage  │
        │  PostgreSQL / MySQL  │        │ (Ticket Attachments) │
        └──────────────────────┘        └──────────────────────┘
```

* **Frontend**: Vanilla JavaScript (ES6+), HTML5, custom Tailwind CSS utility tokens. Zero complex framework overhead for maximum transparency.
* **Backend**: RESTful API service with separation of concerns:
  * Controllers / Routes
  * Service / Business logic (SLA engines, assignment policies)
  * Data Access Layer / Models
  * Middleware (RBAC, JWT validation, file upload validation)
* **Database**: Relational schema (PostgreSQL / MySQL / SQLite) ensuring referential integrity across users, tickets, comments, attachments, and audit logs.

---

## 🚀 DevOps Workflow & Learning Goals

This repository is purpose-built as a **DevOps engineering testbed**:

```
Git/GitHub
   │
   ├─► Feature Branches (`feature/ticket-triage`, `fix/sla-timer`)
   │
   ▼
Pull Requests & Automated Code Review
   │
   ▼
Continuous Integration (CI Pipeline)
   │ - Automated Linting & Style Checks
   │ - Unit & Integration Tests
   │
   ▼
Docker Containerization
   │ - Multi-stage Dockerfile (Backend & Static Frontend)
   │ - Docker Compose (Frontend + Backend + Relational DB)
   │
   ▼
Jenkins / CI-CD Automation
   │ - Build trigger on merge to `main`
   │ - Docker image creation & tagging
   │
   ▼
Deployment & Infrastructure
   │ - Containerized deployment
   │
   ▼
Monitoring & Logging
   │ - Structured application logs
   │ - Health check endpoints (`/healthz`, `/metrics`)
```

### Git Branching Model
* `main`: Production-ready release branch.
* `develop`: Integration branch for completed features.
* `feature/<feature-name>`: Modular branches for isolated feature development.
* `hotfix/<fix-name>`: Emergency patches directly merged into `main` and `develop`.

---

## 🗺️ Development Roadmap & MVP Scope

### Phase 1: Core MVP (Current Focus)
- [x] High-fidelity responsive UI prototypes and enterprise design tokens.
- [x] Customer authentication & role switcher (Customer vs. Staff).
- [x] Customer ticket creation, attachment upload, and personal ticket view.
- [x] Admin ticket list view, status change, and ticket assignment.
- [x] Public comment thread and private internal note tagging.
- [x] Basic SLA deadline calculation and overdue indicators.
- [x] Operations Analytics & live status/priority volume breakdown.
- [x] Slide-over notifications drawer with SLA breach warnings.
- [ ] Backend REST API services (Node.js / Python) with JWT authentication.
- [ ] Relational database schema migrations (PostgreSQL / MySQL / SQLite).

### Phase 2: DevOps Pipeline Integration
- [ ] Containerize services with `Dockerfile` and `docker-compose.yml`.
- [ ] Establish automated unit and integration tests.
- [ ] Create GitHub Actions / Jenkins pipeline for automated lint, build, and test.
- [ ] Configure volume storage for persistent ticket attachments.

### Phase 3: Advanced Operations & Reporting
- [ ] Automated background SLA breach notification daemon.
- [ ] Advanced escalation rules (auto-reassign on breach).
- [ ] Comprehensive audit log export (CSV / JSON).

---

## 📂 Repository Directory Structure

```
Ticket_Flow_System/
├── 🌐 frontend/                          # Production Web Application
│   ├── index.html                        # Application shell with Customer, Admin & Analytics views
│   ├── login.html                        # Customer Login Portal
│   ├── signup.html                       # Customer Registration & Onboarding Portal
│   ├── staff-login.html                  # Organization Staff & Admin Operations Gateway
│   ├── favicon.svg                       # SVG brand icon
│   ├── css/
│   │   └── style.css                     # SupportFlow Precision Enterprise design system
│   └── js/
│       ├── state.js                      # Seed data (tickets, users, audit logs, alerts)
│       ├── api.js                        # Abstracted REST API & localStorage client with auth
│       ├── customer.js                   # Customer Portal controller & stepper UI
│       ├── admin.js                      # Admin Master Queue, triage console & analytics
│       ├── notifications.js              # Slide-over alert center & SLA warnings
│       └── app.js                        # View router, role switcher, user dropdown & shortcuts
│
├── 📦 package.json                       # NPM script lifecycle configurations
└── 📖 README.md                          # Master documentation & specification (this file)
```

---

## 💻 How to Run & Preview the Application

### 1. Launch with NPM
```bash
npm start
# Or build validation:
npm run build
```

### 2. Launch with Python or Static Server
```bash
# Using Python:
python -m http.server 8080 --directory frontend

# Or using npx:
npx serve frontend
```
Then open:
* **Customer Sign In**: `http://localhost:8080/login.html`
* **Customer Registration**: `http://localhost:8080/signup.html`
* **Organization Staff Gateway**: `http://localhost:8080/staff-login.html`
* **Main Application Shell**: `http://localhost:8080/index.html`
