# Application Status (Feature/Scholarship-Application-Status)

This sub-branch implements **application status tracking** for scholarship applications.

## Status flow

| Status       | Allowed next (via action) |
|-------------|----------------------------|
| DRAFT       | (user submits → SUBMITTED) |
| SUBMITTED   | `start_review` → UNDER_REVIEW |
| UNDER_REVIEW| `approve` → APPROVED, `reject` → REJECTED |
| APPROVED    | (final)                    |
| REJECTED    | (final)                    |

Transitions are enforced by **rules/application_status** (appstatus ruleset). The backend evaluates the same rules in code when `GORULES_URL` is not set.

## API

- **GET /scholarship**, **GET /scholarship/:id** – return applications including `status` (all roles with JWT).
- **PATCH /scholarship/:id/status** – body: `{ "action": "start_review" | "approve" | "reject" }`. **Keycloak:** requires **officer** or **admin** role.

## Keycloak

- **applicant** – can submit, list, and view applications; cannot change status.
- **officer**, **admin** – can also call **PATCH /scholarship/:id/status** to move applications through SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED.

See [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) for realm, clients, and test users (`officer1` / `admin`).

## Rules

- **Ruleset:** `rules/application_status` (mapped in `rules/ruleset-mapping.json` as `appstatus`).
- **Tests:** `rules/application_status.test` (GoRules test cases for the decision table).

## PostgreSQL (database for application status)

Everything needed for application status is in place when the app runs with TypeORM `synchronize: true` (default):

- **Table:** `scholarship_applications`
- **Columns used for status:** `id` (uuid), `applicant_id`, `gpa`, `income`, `achievements`, `scholarship_level`, `priority_score`, `documents_valid`, **`status`** (enum: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`), `process_instance_id`, `created_at`, `updated_at`

No extra migration is required. After `docker compose up -d`, the app creates/updates the schema on startup. To confirm: connect to Postgres and run `\d scholarship_applications` (psql) or check the table in a DB client.

## Swagger

All scholarship endpoints, including **PATCH /scholarship/:id/status**, are documented in Swagger. Use the same Bearer token as for other scholarship endpoints (with officer or admin role for status update).
