# Flowable Setup (Features/Scholarship)

BPMN workflows for the scholarship process live here so the team has a single place to run and extend them.

## Placeholders in the repo

- **BPMN files:** Add under `flowable/` or `bpmn/` (e.g. `scholarship-workflow.bpmn20.xml`).
- **NestJS integration:** `ScholarshipService.submitApplication()` has a TODO to start a Flowable process and store `processInstanceId` on the application.

## Suggested workflow steps

1. Applicant submits → NestJS creates application and starts process.
2. Flowable task: officer validation (or auto-approve by rules).
3. Flowable task: notification (email/internal).
4. End event → status updated in DB.

## When you add Flowable

- Add Flowable engine (Docker or embedded) and connection config in NestJS.
- Implement a Flowable service that starts processes and completes tasks.
- Call it from `ScholarshipService` after saving the application and optionally from webhooks/callbacks for task completion.

Once BPMN files and the NestJS Flowable client are in this branch, everyone can pull and run the full flow.
