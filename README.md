# CloudPilot — Multi-Cloud Infrastructure Dashboard

A full-stack dashboard for managing **AWS**, **Azure**, and **GCP** infrastructure from a single interface.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Django](https://img.shields.io/badge/Django-5.x-green) ![MongoDB](https://img.shields.io/badge/MongoDB-7.x-success)

## Features

- **VM Management** — List, start, stop, and monitor virtual machines across all three clouds
- **Storage Management** — View buckets/containers with size, encryption, and cost data
- **Billing & Costs** — Daily breakdown charts, budget tracking, and cost forecasting
- **Real-time Monitoring** — CPU, memory, disk, and network metrics with interactive charts
- **Alerts System** — Severity-based alerts with acknowledgement, rules, and history
- **Analytics** — Resource distribution, cost optimization recommendations, and provider comparison
- **JWT Authentication** — Secure access with access/refresh token rotation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts |
| Backend | Django 5, Django REST Framework |
| Database | MongoDB (via PyMongo) |
| Auth | JWT (PyJWT + bcrypt) |
| Cloud SDKs | boto3, azure-mgmt-*, google-cloud-* |

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running on `localhost:27017`

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/

### First-time Setup
1. Open http://localhost:5173
2. Click "Create one" to register a new account
3. Start exploring the dashboard!

## Project Structure

```
Multicloud/
├── backend/
│   ├── config/              # Django settings, URLs
│   ├── core/                # MongoDB connector, pagination, exceptions
│   └── apps/
│       ├── authentication/  # JWT auth
│       ├── cloud_providers/ # Adapter pattern (mock + live)
│       ├── virtual_machines/
│       ├── storage/
│       ├── billing/
│       ├── monitoring/
│       ├── alerts/
│       └── analytics/
└── frontend/
    └── src/
        ├── api/             # Axios client + service layer
        ├── context/         # Auth context
        ├── layouts/         # Dashboard shell
        └── pages/           # All route pages
```

## Cloud Mode

By default, the app runs in **mock mode** with realistic simulated data. To connect real cloud providers, update `backend/.env`:

```env
CLOUD_MODE=live
AWS_ACCESS_KEY_ID=your-key
# ... etc
```

## API Endpoints

| Module | Endpoints |
|--------|----------|
| Auth | `POST /api/auth/login/`, `register/`, `refresh/`, `GET profile/` |
| VMs | `GET /api/vms/`, `POST /api/vms/{id}/action/` |
| Storage | `GET /api/storage/`, `GET stats/` |
| Billing | `GET summary/`, `daily/`, `services/`, `forecast/`, `budgets/` |
| Monitoring | `GET metrics/`, `network/`, `health/`, `utilization/` |
| Alerts | `GET /api/alerts/`, `POST {id}/ack/`, `GET rules/`, `history/` |
| Analytics | `GET distribution/`, `trends/`, `optimization/`, `comparison/` |
