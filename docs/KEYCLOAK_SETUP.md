# Keycloak Setup (Features/Scholarship)

Keycloak is configured **automatically** when you run `docker compose up -d`. The realm, clients, roles, and test users are imported from the `keycloak/` folder.

## What’s included

- **Realm:** `e-gov-portal`
- **Realm roles:** `applicant`, `officer`, `admin`
- **Clients:**
  - `scholarship-api` (confidential) – used by the NestJS backend to validate JWTs
  - `scholarship-frontend` (public) – for SPAs / frontend apps
- **Test users** (imported from `keycloak/e-gov-portal-users-0.json`):

| Username    | Password | Roles    |
|------------|----------|----------|
| applicant1 | test123  | applicant |
| officer1   | test123  | officer   |
| admin      | admin123 | admin    |

- **Admin console:** http://localhost:8080 (login: `admin` / `admin`)

## Getting a JWT (for API calls)

### Option 1: Direct grant (password) – e.g. Postman/curl

```bash
curl -s -X POST "http://localhost:8080/realms/e-gov-portal/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=applicant1" \
  -d "password=test123" \
  -d "grant_type=password" \
  -d "client_id=scholarship-frontend"
```

Use the `access_token` from the response as the Bearer token.

### Option 2: Admin Console

1. Open http://localhost:8080 → sign in as `admin` / `admin`.
2. Select realm **e-gov-portal**.
3. Create users and assign roles under **Users** and **Realm roles**.
4. Use **Direct grant** or a frontend client to obtain tokens.

## Secured endpoints

- **GET /** – public (no token).
- **POST /scholarship/apply**, **GET /scholarship**, **GET /scholarship/:id** – require a valid JWT and one of: `applicant`, `officer`, `admin`.

Example with token:

```bash
export TOKEN="<access_token from above>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/scholarship
```

## Environment (optional)

Copy `.env.example` to `.env` and adjust if Keycloak is not on `localhost:8080`:

- `KEYCLOAK_ISSUER` – realm issuer URL
- `KEYCLOAK_JWKS_URI` – JWKS URL for JWT verification

Defaults work with the provided `docker-compose.yml`.

## Re-importing the realm

If the realm already exists, Keycloak **skips** import on startup. To re-import (e.g. after changing `keycloak/*.json`):

1. Stop containers: `docker compose down`.
2. Remove the realm via Admin Console or delete Keycloak data.
3. Start again: `docker compose up -d`.

Or run a one-time import using Keycloak’s CLI inside the container (see Keycloak docs).
