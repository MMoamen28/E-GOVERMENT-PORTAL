# Flowable Integration Guide

This guide explains how Flowable is now fully integrated with the E-Government Portal.

## Overview

Flowable is a process automation engine that manages workflows for scholarship applications and other government services. The integration includes:

- **BPMN Workflow Files** - Workflow definitions in `flowable/` directory
- **NestJS Flowable Service** - `src/flowable/flowable.service.ts` handles communication with Flowable REST API
- **Task Management Endpoints** - New API endpoints for getting and completing workflow tasks
- **Automatic Process Deployment** - BPMN files are automatically deployed when the application starts
- **Docker Integration** - Flowable runs in a Docker container with shared PostgreSQL database

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Application                        │
│                     (Port 3000)                              │
├──────────────────────┬──────────────────────────────────────┤
│ ScholarshipService   │ Other Services...                     │
├──────────────────────┼──────────────────────────────────────┤
│        FlowableService (src/flowable/flowable.service.ts)   │
│  • startProcessInstance()                                    │
│  • deployProcessDefinition()                                │
│  • completeTask()                                            │
│  • getTasksForProcessInstance()                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP REST API
                       │
        ┌──────────────▼──────────────┐
        │  Flowable REST Engine       │
        │  (Docker, Port 8090)        │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  PostgreSQL Database        │
        │  (Shared with App)          │
        └─────────────────────────────┘
```

## Workflow Files

### scholarship-workflow.bpmn20.xml

The scholarship application workflow includes:

1. **Document Validation** - User task for officers to validate submitted documents
2. **Document Gateway** - Conditional routing based on document validity
3. **Officer Review** - Main review task where officers make approval/rejection decisions
4. **Review Decision Gateway** - Routes to approval or rejection path
5. **Notification Tasks** - Service tasks to notify applicants of decisions

#### Key Features:
- Variables: `applicantId`, `applicationId`, `priorityScore`, `scholarshipLevel`, `approvalDecision`
- Conditional flows based on `documentsValid` and `approvalDecision` variables
- Automatic status updates in the ScholarshipApplication entity

## API Endpoints

### Get Application Workflow Tasks
```bash
GET /scholarship/:id/workflow/tasks
```
Retrieves all pending Flowable tasks for a scholarship application.

**Response:**
```json
{
  "data": [
    {
      "id": "task123",
      "name": "Review Scholarship Application",
      "processInstanceId": "proc456",
      "assignee": null,
      "candidateGroups": ["officers"]
    }
  ]
}
```

### Get Workflow Process Status
```bash
GET /scholarship/:id/workflow/status
```
Get the current status of the Flowable process instance.

**Response:**
```json
{
  "id": "proc456",
  "processDefinitionId": "scholarshipProcess:1:12345",
  "processDefinitionUrl": "http://localhost:8090/flowable-rest/service/repository/process-definitions/scholarshipProcess:1:12345",
  "suspended": false,
  "variables": {
    "applicationId": "app-uuid",
    "applicantId": "user-123",
    "priorityScore": 85,
    "scholarshipLevel": "LEVEL_2"
  }
}
```

### Complete a Workflow Task
```bash
POST /scholarship/:id/workflow/complete-task
```
Complete a task and advance the workflow.

**Request Body:**
```json
{
  "taskId": "task123",
  "approvalDecision": "APPROVE",
  "reason": "Meets all requirements"
}
```

**Response:**
```json
{
  "id": "app-uuid",
  "status": "APPROVED",
  "applicantId": "user-123",
  "scholarshipLevel": "LEVEL_2",
  "priorityScore": 85,
  "processInstanceId": "proc456",
  ...
}
```

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Flowable Engine Configuration
FLOWABLE_URL=http://localhost:8090/flowable-rest/service
FLOWABLE_USER=admin
FLOWABLE_PASS=test
```

### Docker Compose

The `docker-compose.yml` includes:

```yaml
flowable:
  image: flowable/flowable-rest:6.8.0
  environment:
    spring.datasource.url: jdbc:postgresql://postgres:5432/e_gov_portal
    spring.datasource.username: egov_user
    spring.datasource.password: egov_pass
    spring.datasource.driver-class-name: org.postgresql.Driver
    flowable.rest.app.admin.user-id: admin
    flowable.rest.app.admin.password: test
  ports:
    - "8090:8080"
  depends_on:
    - postgres
```

The app service has these environment variables set:
```yaml
FLOWABLE_URL: http://flowable:8080/flowable-rest/service
FLOWABLE_USER: admin
FLOWABLE_PASS: test
```

And `app` depends on `flowable` service.

## Workflow Lifecycle

### 1. Application Submission
```typescript
// In ScholarshipService.submitApplication()
const processInstance = await this.flowableService.startProcessInstance('scholarshipProcess', {
  applicationId: savedApp.id,
  applicantId: savedApp.applicantId,
  priorityScore: savedApp.priorityScore,
  scholarshipLevel: savedApp.scholarshipLevel,
});
savedApp.processInstanceId = processInstance.id;
```

### 2. Officer Views Tasks
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/scholarship/:applicationId/workflow/tasks
```

### 3. Officer Completes Task
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "flowableTaskId",
    "approvalDecision": "APPROVE"
  }' \
  http://localhost:3000/scholarship/:applicationId/workflow/complete-task
```

### 4. Application Status is Updated
- Application status updates to APPROVED or REJECTED
- Workflow continues to notification phase
- Service tasks send notification emails

## Adding New Workflows

### Step 1: Create BPMN File
Place your BPMN XML file in the `flowable/` directory with extension `.bpmn20.xml`.

Example: `flowable/my-service-workflow.bpmn20.xml`

### Step 2: Auto-Deployment
The FlowableService's `onModuleInit()` method automatically:
- Scans the `flowable/` directory
- Deploys all `.bpmn20.xml` files to the Flowable engine

No manual deployment is needed!

### Step 3: Start Process from Your Service
```typescript
// In your service
constructor(private flowableService: FlowableService) {}

async myMethod() {
  const result = await this.flowableService.startProcessInstance('myServiceProcess', {
    variableKey: variableValue
  });
  // Store the processInstanceId
}
```

### Step 4: Handle Task Completion
Similar to the scholarship workflow, implement task completion handlers that:
- Get the task variables
- Process business logic
- Update database entities
- Complete the task in Flowable

## Monitoring

### View Flowable Admin Console
- URL: `http://localhost:8090/flowable-admin`
- Username: admin
- Password: test

From here you can:
- See all deployed process definitions
- Monitor running process instances
- View task lists
- Manually complete tasks if needed

### Check Process Logs
The NestJS application logs all Flowable interactions. Look for log messages like:
```
[FlowableService] Started Flowable process instance: proc123
[FlowableService] Completed Flowable task: task456
[FlowableService] Deployed Flowable process: scholarship-workflow.bpmn20.xml
```

## Troubleshooting

### Issue: "Failed to start Flowable process instance"

**Check:**
1. Is Flowable service running? `docker ps | grep flowable`
2. Is the process definition deployed? Check Flowable admin console
3. Is the `FLOWABLE_URL` correct in environment?
4. Are credentials (`FLOWABLE_USER`, `FLOWABLE_PASS`) correct?

### Issue: "Flowable process instance not found"

**Check:**
1. Verify `application.processInstanceId` is stored in database
2. Check Flowable logs for errors
3. Connect to PostgreSQL and check `ACT_HI_PROCINST` table

### Issue: "Task not found"

**Check:**
1. Get process status with `GET /scholarship/:id/workflow/status`
2. Verify task actually exists in `GET /scholarship/:id/workflow/tasks`
3. Check if task is already completed

## Best Practices

1. **Always Store processInstanceId** - Save the process instance ID returned from `startProcessInstance()` in your database
2. **Variable Naming** - Use camelCase for variable names in BPMN and TypeScript
3. **Error Handling** - Workflow failures should not crash your application (as implemented in `submitApplication()`)
4. **Testing** - Test workflows locally with `docker-compose up` before deploying
5. **Monitoring** - Regularly check Flowable admin console and application logs
6. **Database Backups** - The `e_gov_portal` database contains both app and workflow data

## Integration with Rules Engine

The scholarship workflow can integrate with GoRules for:
- Automatic eligibility determination
- Document validation
- Priority scoring
- Scholarship level assignment

Variables from rules are passed to Flowable:
- `eligibility.eligible` → `eligible`
- `docStatus.valid` → `documentsValid`
- `priorityScore` → `priorityScore`
- `scholarshipLevel` → `scholarshipLevel`

## Performance Considerations

- **Process Instance Cleanup** - Consider archiving old completed processes periodically
- **Database Growth** - Flowable creates audit tables; monitor database size
- **Task Querying** - Getting tasks for many applications can be slow; implement pagination if needed

## Support & Resources

- [Flowable Documentation](https://flowable.org/docs/)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [Flowable REST API](https://flowable.org/docs/userguide/index.html#restapi)
