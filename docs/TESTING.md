# How to Test Everything

Quick guide to run and test the E-Government Portal (backend, frontend, and API with Keycloak).

---

## 1. Start the backend (PostgreSQL + Keycloak + NestJS)

### Step 1: Start Docker services

From the **project root**:

```bash
docker compose up -d
```

- **PostgreSQL** → `localhost:5432` (user: `egov_user`, password: `egov_pass`, db: `e_gov_portal`)
- **Keycloak** → http://localhost:8080 (admin / admin). Realm `e-gov-portal` and test users are auto-imported.

Check that containers are running:

```bash
docker compose ps
```

### Step 2: Run the NestJS API

```bash
npm install
npm run start:dev
```

Wait until you see something like: `Nest application successfully started`.

- **API base** → http://localhost:3000  
- **Public** → http://localhost:3000 (GET `/` returns “Hello World”)  
- **Protected** → `POST /api/scholarship/apply`, `GET /api/scholarship`, `GET /api/scholarship/:id` require a JWT.

---

## 2. Test the API (with Keycloak token)

### Get a JWT from Keycloak

**Option A – PowerShell:**

```powershell
$body = @{
  username     = "applicant1"
  password     = "test123"
  grant_type   = "password"
  client_id    = "scholarship-frontend"
}
$r = Invoke-RestMethod -Uri "http://localhost:8080/realms/e-gov-portal/protocol/openid-connect/token" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
$r.access_token
```

**Option B – curl (if available):**

```bash
curl -s -X POST "http://localhost:8080/realms/e-gov-portal/protocol/openid-connect/token" ^
  -d "username=applicant1" -d "password=test123" -d "grant_type=password" -d "client_id=scholarship-frontend"
```

Copy the `access_token` from the JSON response.

### Call the scholarship API

Replace `YOUR_TOKEN` with the token you got:

- **List applications:**  
  `GET http://localhost:3000/api/scholarship`  
  Header: `Authorization: Bearer YOUR_TOKEN`

- **Submit application:**  
  `POST http://localhost:3000/api/scholarship/apply`  
  Header: `Authorization: Bearer YOUR_TOKEN`  
  Body (JSON):  
  `{ "applicantId": "user-123", "gpa": 3.8, "income": 1500, "achievements": true }`

You can use **Postman**, **Insomnia**, or browser dev tools. If you call `/api/scholarship` without a token you should get `401 Unauthorized`.

**Test users:** See `docs/KEYCLOAK_SETUP.md` (e.g. `applicant1` / `test123`, `officer1` / `test123`, `admin` / `admin123`).

---

## 3. Test the frontend

The frontend is static HTML/CSS/JS in the **`frontend/`** folder.

### Option A: Open in browser (no server)

1. Open `frontend/index.html` in your browser (double-click or File → Open).
2. Click **Home**, **Services**, **Contact**, **Login** and use the forms (validation, login redirect, contact message).

Some features (e.g. loading external fonts) work better with a local server (Option B).

### Option B: Serve with a local server (recommended)

From the **project root**:

```bash
npx serve frontend -l 5000
```

Then open **http://localhost:5000** in your browser.

- **Home** – Hero, announcements, 3 featured services, stats counters, “How it works”, footer.
- **Services** – ID Renewal, Business License Request, Scholarship Request; “Apply Now” goes to Login.
- **Login** – National ID (10 digits) + password; validation and “Sign In” (currently shows success alert and redirects to home).
- **Contact** – Form validation and “message sent” confirmation.

The frontend does **not** call the NestJS API yet; it’s UI-only. To test the full flow (frontend → API), you’d later point the frontend to `http://localhost:3000` and send the Keycloak token with requests.

---

## 4. Run unit tests (NestJS)

```bash
npm run test
```

Runs Jest unit tests for the NestJS app.

---

## 5. Quick checklist

| What to test              | How |
|---------------------------|-----|
| PostgreSQL + Keycloak up  | `docker compose ps` |
| NestJS starts             | `npm run start:dev` → no DB/connection errors |
| Public endpoint           | Browser: http://localhost:3000 → “Hello World” |
| Keycloak login            | http://localhost:8080 → admin / admin, realm `e-gov-portal` |
| Get JWT                   | Token request with `applicant1` / `test123` (see section 2) |
| Protected API             | `GET /api/scholarship` with `Authorization: Bearer <token>` → 200 and list (or empty array) |
| Submit application        | `POST /api/scholarship/apply` with body + Bearer token → 201 and saved application |
| Frontend home/services     | Open `frontend/index.html` or http://localhost:5000 (serve) |
| Frontend login/contact     | Use forms; check validation and success messages |

For Keycloak details and token examples: **`docs/KEYCLOAK_SETUP.md`**.
