# E-Government Digital Portal

A consolidated microservices architecture designed to modernize and formalize citizen electronic services. The portal provides a secure, accessible, and automated gateway for handling critical government processes such as **Scholarship Applications**, **Business Licensing**, and **National ID Renewals** through complex BPMN approval workflows and dual-rules validation.

---

## 🚀 Project Overview

The E-Government Portal serves as a unified digital infrastructure for citizen-to-government interaction. It leverages a robust microservices backend to orchestrate long-running processes, validate submissions against real-time regulatory rules, and ensure high-standard Identity and Access Management (IAM).

Key features include:
- **Consolidated Service Catalog**: Unified UI for all available citizen services.
- **Automated Workflows**: Full BPMN integration for multi-stage application approvals.
- **Dynamic Rules Engine**: Validation of citizen eligibility using externalized business rules.
- **WCAG 2.1 AA Compliance**: A highly accessible frontend designed for a diverse citizen base.

---

## 🛠️ Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend API** | [NestJS](https://nestjs.com/) | Modular TypeScript microservices framework. |
| **Frontend** | Vanilla HTML / JS / CSS | Formal, accessible, high-performance UI. |
| **Workflow Engine** | [Flowable](https://www.flowable.com/) | BPMN 2.0 orchestration and task management. |
| **Rules Engine** | [GoRules (ZenEngine)](https://gorules.io/) | JSON-driven business rules/logic validation. |
| **Identity (IAM)** | [Keycloak](https://www.keycloak.org/) | OIDC/SAML single sign-on and role management. |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Reliable relational data storage. |
| **Orchestration** | [Docker Compose](https://www.docker.com/) | Containerized local and deployment environment. |

---

## 📋 Prerequisites & System Requirements

To ensure smooth operation of the local cluster, your system must meet the following requirements:

- **Environment**: Docker and Docker Compose (v2.x+ recommended).
- **Resources (WSL2 / Linux / Mac)**:
  - **Minimum RAM**: 6GB - 8GB (Highly recommended to accommodate Keycloak and Flowable).
  - **Minimum CPUs**: 4 Cores.
  
> [!TIP]
> **Windows Users**: If using WSL2, update your `.wslconfig` file in `%USERPROFILE%` with the following limits to prevent OOM (Out of Memory) issues during container startup:
> ```ini
> [wsl2]
> memory=8GB
> processors=4
> ```

---

## 🏁 Getting Started (Local Development)

Follow these steps to spin up the entire unified portal environment on your local machine:

1. **Switch to Development Branch**
   ```bash
   git checkout Development
   ```

2. **Clean Container State** (Optional but recommended)
   ```bash
   docker compose down -v
   ```

3. **Build and Deploy the Stack**
   ```bash
   docker compose up -d --build
   ```

> [!NOTE]
> **Startup Time**: While the NestJS API initializes quickly, the **Flowable** container requires internal Java initialization and may take up to **60 seconds longer** to reach a ready state.

---

## 🗺️ Local Service Mapping & Endpoints

| Service | Localhost URL | Description |
| :--- | :--- | :--- |
| **Frontend Portal** | [http://localhost:8888](http://localhost:8888) | Citizen-facing formal interface. |
| **NestJS API Root** | [http://localhost:3000](http://localhost:3000) | Core backend JSON API. |
| **Swagger API Docs** | [http://localhost:3000/docs](http://localhost:3000/docs) | Interactive API documentation. |
| **Keycloak Admin** | [http://localhost:8080/admin](http://localhost:8080/admin) | Identity and realm management. |
| **Flowable BPM UI** | [http://localhost:8082/flowable-ui/](http://localhost:8082/flowable-ui/) | Workflow modeling and task dashboard. |
| **Flowable REST** | [http://localhost:8082/flowable-rest](http://localhost:8082/flowable-rest) | Flowable integration endpoint. |
| **GoRules Engine** | [http://localhost:8090](http://localhost:8090) | Business rules visual editor (Studio). |
| **PostgreSQL DB** | `localhost:5433` | Persistence layer for core services. |

---

## 🔑 Test Accounts & Credentials

### System Administrative Access
| System | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Keycloak Admin** | `admin` | `admin` | Realm: `egov-portal` |
| **Flowable UI** | `admin` | `test` | For modeling & monitoring. |
| **Flowable REST** | `rest-admin` | `test` | Internal service account. |

### End-User Testing
| Account Role | Username | Password |
| :--- | :--- | :--- |
| **Verified Citizen** | `portal_tester2` | `Portal123!` |

---

## 👤 Role-Based Testing (Supervisors)
To test the full lifecycle of an application (e.g., approving a Scholarship or Business License):
1. Log into the **Keycloak Admin Console**.
2. Select the `egov-portal` realm.
3. Create a new user or identify an existing one.
4. Assign the **`supervisor`** role to this account.
5. Use this supervisor account to log into the **Flowable Task UI** to review, approve, or reject pending citizen requests.

---
© 2026 E-Government Digital Portal Project. All rights reserved.
