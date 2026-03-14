# Features/Scholarship — Integration Branch Checklist

This branch is the **main integration branch** for the scholarship feature. Every developer pulls from it to get a full, runnable setup.

---

## 1. GoRules

**Rules are owned per service/sub-branch**, not only by Features/Scholarship. Each team develops their ruleset in their own sub-branch; when they merge here, their ruleset lives in **`rules/`** (one file per ruleset).

- **Rules location:** All rulesets live in **`rules/`** (e.g. `document_validation`, `priority_rules`, `scholarship`, `eligibility_policy`). Each file is owned by one service/sub-branch.
- **Mapping:** **`rules/README.md`** and **`rules/ruleset-mapping.json`** (service name → ruleset path). NestJS or GoRules server uses this to know which file to use per service.
- [ ] Each sub-branch: rules tested in GoRules and stable before merge
- No extra setup needed in this branch beyond the mapping above.

---

## 2. NestJS Backend

- [ ] **Scholarship module** in `src/scholarship/`:
  - `scholarship.entity.ts` — PostgreSQL entity
  - `scholarship.service.ts` — submission, GoRules calls, DB updates
  - `scholarship.controller.ts` — API endpoints
- [ ] PostgreSQL connection configured in `app.module.ts` (already done)
- [ ] TypeORM entities/migrations in repo so DB is ready after `npm run start`

---

## 3. PostgreSQL

- [ ] Schema defined via TypeORM entities (or migrations)
- [ ] One-command run: `docker compose up -d` + app start = DB ready

---

## 4. Keycloak

- [ ] Roles, clients, realm config documented or scripted
- [ ] Config files or import scripts in repo (e.g. `keycloak/realm-export.json` or `docs/KEYCLOAK_SETUP.md`)
- [ ] All scholarship endpoints secured with Keycloak from day one

---

## 5. Flowable

- [ ] BPMN process files for scholarship workflow in repo (e.g. `flowable/` or `bpmn/`)
- [ ] NestJS services that Flowable calls (tasks, events, decisions)
- [ ] Flowable engine connection config (when added)

---

## 6. Team Workflow

**Starting point:** `git checkout features/scholarship` (or your branch name) and pull.

**Developers get:**

- GoRules rules merged
- NestJS backend + PostgreSQL
- Keycloak auth ready
- Flowable workflows defined

**They only need to:**

- Implement feature logic or tests
- Push improvements/rules back to this branch

---

## 7. Flow Example

1. User submits application via NestJS API (e.g. `POST /api/scholarship/apply`).
2. NestJS service sends input to GoRules (levels, priority, doc validation, etc.).
3. GoRules returns decision (approval, priority, level).
4. NestJS updates PostgreSQL with result.
5. Flowable workflow picks up the event and runs next tasks (officer validation, notifications).
6. Keycloak enforces role-based access on every endpoint.
