# Rules — one ruleset per service/sub-branch

The files in this folder are **GoRules rulesets**. Each ruleset is owned and developed on its **own sub-branch**; this branch (Features/Scholarship) is where they are integrated.

## Ruleset → service / branch mapping

| Ruleset file (in `rules/`) | Service name   | Sub-branch / owner        |
|----------------------------|----------------|---------------------------|
| `document_validation`      | docvalidation  | Doc validation service    |
| `priority_rules`           | prioritycheck  | Priority service          |
| `scholarship`              | levels         | Levels service            |
| `eligibility_policy`       | policies       | Policies service          |

*(Add `appstatus` when that service branch exists.)*

## Workflow

- **Edit in GoRules** → **Git sync** (rules saved to your branch) → **merge into Features/Scholarship**. No direct connection from NestJS to GoRules is required; rules are just files in the repo after merge.
- **On your sub-branch:** You work on your ruleset (e.g. `rules/document_validation` for doc-validation). Test in GoRules, then merge into Features/Scholarship.
- **In Features/Scholarship:** All rulesets live here in `rules/`. The backend (or GoRules server) uses the mapping above to know which file to use for each service.

No extra setup is required in this branch beyond this mapping; each sub-branch sets up and runs what it needs for its own ruleset.
