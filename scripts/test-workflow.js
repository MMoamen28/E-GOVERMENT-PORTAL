async function testWorkflow() {
  const baseUrl = 'http://localhost:8090/flowable-rest/service';
  const auth = Buffer.from('admin:test').toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  console.log('--- Testing Scholarship Workflow ---');
  
  // 1. Start a process instance
  console.log('Starting process instance for scholarshipProcess...');
  const startResponse = await fetch(`${baseUrl}/runtime/process-instances`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      processDefinitionKey: 'scholarshipProcess',
      variables: [
        { name: 'applicantId', value: 'test-user-123' },
        { name: 'priorityScore', value: 85 },
        { name: 'scholarshipLevel', value: 'HIGH' }
      ]
    })
  });

  if (!startResponse.ok) {
    console.error('Failed to start process:', await startResponse.text());
    return;
  }

  const processInstance = await startResponse.json();
  console.log(`Process instance started. ID: ${processInstance.id}`);

  // 2. Check for active tasks
  console.log('Checking for active tasks...');
  const tasksResponse = await fetch(`${baseUrl}/runtime/tasks?processInstanceId=${processInstance.id}`, {
    headers
  });

  if (!tasksResponse.ok) {
    console.error('Failed to get tasks:', await tasksResponse.text());
    return;
  }

  const tasks = await tasksResponse.json();
  console.log(`Found ${tasks.total} active tasks.`);
  tasks.data.forEach(task => {
    console.log(`Task Found: [${task.id}] ${task.name} (Assignee: ${task.assignee})`);
  });

  if (tasks.total > 0) {
    console.log('Workflow is active and waiting for user review.');
  } else {
    console.log('Workflow completed or no tasks found.');
  }
}

testWorkflow();
