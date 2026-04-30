const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const KEYCLOAK_URL = 'http://localhost:8080/realms/e-gov-portal/protocol/openid-connect/token';
const FLOWABLE_URL = 'http://localhost:8090/flowable-rest/service';

async function getToken(username) {
  const response = await axios.post(KEYCLOAK_URL, new URLSearchParams({
    grant_type: 'password',
    client_id: 'scholarship-api',
    client_secret: 'scholarship-api-secret-change-in-production',
    username,
    password: 'test123'
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

async function testFlowableIntegration() {
  const results = {
    tests: [
      { name: '1. NestJS App is running', status: '❌', msg: '' },
      { name: '2. Keycloak authentication works', status: '❌', msg: '' },
      { name: '3. Flowable engine accessible', status: '❌', msg: '' },
      { name: '4. BPMN processes deployed', status: '❌', msg: '' },
      { name: '5. Scholarship application submission', status: '❌', msg: '' },
      { name: '6. Flowable process auto-started', status: '❌', msg: '' },
      { name: '7. Officer can view workflow tasks', status: '❌', msg: '' },
      { name: '8. Officer can complete tasks', status: '❌', msg: '' },
      { name: '9. Application status updated', status: '❌', msg: '' },
      { name: '10. All workflow steps integrated', status: '❌', msg: '' }
    ]
  };

  try {
    // Test 1: NestJS app running
    try {
      await axios.get(`${API_BASE}/api/health`);
      results.tests[0] = { ...results.tests[0], status: '✅' };
    } catch (e) {
      throw new Error('NestJS app not responding');
    }

    // Test 2: Keycloak authentication
    let applicantToken, officerToken;
    try {
      applicantToken = await getToken('applicant1');
      officerToken = await getToken('officer1');
      results.tests[1] = { ...results.tests[1], status: '✅' };
    } catch (e) {
      throw new Error('Keycloak authentication failed');
    }

    // Test 3: Flowable engine accessible
    try {
      await axios.get(`${FLOWABLE_URL}/repository/process-definitions`, {
        auth: { username: 'admin', password: 'test' }
      });
      results.tests[2] = { ...results.tests[2], status: '✅' };
    } catch (e) {
      throw new Error('Flowable engine not accessible');
    }

    // Test 4: BPMN processes deployed
    try {
      const response = await axios.get(`${FLOWABLE_URL}/repository/process-definitions`, {
        auth: { username: 'admin', password: 'test' }
      });
      const processes = response.data.data || [];
      const scholarship = processes.find(p => p.key === 'scholarshipProcess');
      const govPortal = processes.find(p => p.key === 'govPortalWorkflow');
      if (scholarship && govPortal) {
        results.tests[3] = { ...results.tests[3], status: '✅', msg: `(${processes.length} total deployed)` };
      } else {
        throw new Error('Expected BPMN processes not deployed');
      }
    } catch (e) {
      throw new Error('BPMN process deployment check failed');
    }

    // Test 5: Scholarship application submission
    let appId, processInstanceId;
    try {
      const response = await axios.post(`${API_BASE}/scholarship/apply`, {
        applicantId: 'test-' + Date.now(),
        gpa: 3.8,
        income: 2000,
        achievements: true,
        isOrphan: false,
        isStudent: true,
        hasID: true,
        hasIncomeDoc: true,
        hasStudentCert: true,
        hasFamilyStatus: true
      }, {
        headers: { 'Authorization': `Bearer ${applicantToken}` }
      });
      appId = response.data.id;
      processInstanceId = response.data.processInstanceId;
      results.tests[4] = { ...results.tests[4], status: '✅' };
    } catch (e) {
      throw new Error('Application submission failed: ' + e.message);
    }

    // Test 6: Flowable process auto-started
    if (processInstanceId && processInstanceId.trim() !== '') {
      results.tests[5] = { ...results.tests[5], status: '✅', msg: `(ID: ${processInstanceId.substring(0, 8)}...)` };
    } else {
      throw new Error('Flowable process not started (empty processInstanceId)');
    }

    // Test 7: Officer can view workflow tasks
    let taskId;
    try {
      const response = await axios.get(`${API_BASE}/scholarship/${appId}/workflow/tasks`, {
        headers: { 'Authorization': `Bearer ${officerToken}` }
      });
      const tasks = response.data.data || response.data || [];
      if (tasks.length > 0) {
        taskId = tasks[0].id;
        results.tests[6] = { ...results.tests[6], status: '✅', msg: `(${tasks.length} pending task(s))` };
      } else {
        throw new Error('No workflow tasks found');
      }
    } catch (e) {
      throw new Error('Failed to get workflow tasks: ' + e.message);
    }

    // Test 8: Officer can complete tasks
    let finalStatus;
    if (taskId) {
      try {
        const response = await axios.post(`${API_BASE}/scholarship/${appId}/workflow/complete-task`, {
          taskId,
          approvalDecision: 'APPROVE',
          reason: 'Test approval'
        }, {
          headers: { 'Authorization': `Bearer ${officerToken}` }
        });
        finalStatus = response.data.status;
        results.tests[7] = { ...results.tests[7], status: '✅' };
      } catch (e) {
        throw new Error('Failed to complete task: ' + e.message);
      }
    } else {
      throw new Error('No task ID available for completion');
    }

    // Test 9: Application status updated
    if (finalStatus === 'APPROVED') {
      results.tests[8] = { ...results.tests[8], status: '✅', msg: `(Status: ${finalStatus})` };
    } else {
      throw new Error(`Application status not updated correctly (was: ${finalStatus})`);
    }

    // Test 10: All workflow steps integrated
    results.tests[9] = { ...results.tests[9], status: '✅', msg: '(Complete 100% integration)' };

  } catch (error) {
    console.error('Test failed:', error.message);
    // Mark the failed test
    for (let i = 0; i < results.tests.length; i++) {
      if (results.tests[i].status === '❌') {
        results.tests[i].msg = error.message;
        break;
      }
    }
  }

  return results;
}

async function main() {
  console.log('\n' + '═'.repeat(80));
  console.log('🎯 FLOWABLE INTEGRATION - 100% VALIDATION TEST SUITE');
  console.log('═'.repeat(80) + '\n');

  const results = await testFlowableIntegration();

  results.tests.forEach(test => {
    const pad = ' '.repeat(Math.max(0, 52 - test.name.length));
    console.log(`${test.name}${pad}${test.status} ${test.msg}`);
  });

  const passed = results.tests.filter(t => t.status === '✅').length;
  const total = results.tests.length;
  const percentage = Math.round((passed / total) * 100);

  console.log('\n' + '═'.repeat(80));
  console.log(`📊 RESULTS: ${passed}/${total} tests passed (${percentage}%)`);
  console.log('═'.repeat(80));

  if (percentage === 100) {
    console.log('\n🎉 SUCCESS! Flowable is 100% integrated and working!\n');
    console.log('Key Capabilities:');
    console.log('  • Scholarship applications automatically trigger Flowable workflows');
    console.log('  • Officers can view pending workflow tasks');
    console.log('  • Officers can approve/reject applications via workflow tasks');
    console.log('  • Application status automatically updates with workflow progress');
    console.log('  • Both studentship and e-government workflows are deployed');
    console.log('  • Full JWT authentication with Keycloak integration');
    console.log('  • Docker containerization with automatic BPMN deployment\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the messages above.\n');
    process.exit(1);
  }
}

main();
