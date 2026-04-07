const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const KEYCLOAK_URL = 'http://localhost:8080/realms/e-gov-portal/protocol/openid-connect/token';
const FLOWABLE_URL = 'http://localhost:8090/flowable-rest/service';

let token = '';
let appId = '';
let processInstanceId = '';

async function getToken() {
  try {
    console.log('\n📝 Getting authentication token...');
    const response = await axios.post(KEYCLOAK_URL, new URLSearchParams({
      grant_type: 'password',
      client_id: 'scholarship-api',
      client_secret: 'scholarship-api-secret-change-in-production',
      username: 'applicant1',
      password: 'test123'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    token = response.data.access_token;
    console.log('✅ Token obtained (expires in ' + response.data.expires_in + 's)');
    return token;
  } catch (error) {
    console.error('❌ Failed to get token:', error.response?.data || error.message);
    throw error;
  }
}

async function submitScholarship() {
  try {
    console.log('\n📝 Submitting scholarship application...');
    const response = await axios.post(`${API_BASE}/scholarship/apply`, {
      applicantId: 'test-app-' + Date.now(),
      gpa: 3.9,
      income: 1800,
      achievements: true,
      isOrphan: true,
      isStudent: true,
      hasID: true,
      hasIncomeDoc: true,
      hasStudentCert: true,
      hasFamilyStatus: true
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    appId = response.data.id;
    processInstanceId = response.data.processInstanceId;
    
    console.log('✅ Application submitted:');
    console.log('   - ID: ' + appId);
    console.log('   - Status: ' + response.data.status);
    console.log('   - Process Instance ID: ' + (processInstanceId ? processInstanceId : '❌ NOT SET'));
    console.log('   - Scholarship Level: ' + response.data.scholarshipLevel);
    console.log('   - Priority Score: ' + response.data.priorityScore);
    
    return appId;
  } catch (error) {
    console.error('❌ Failed to submit application:', error.response?.data || error.message);
    throw error;
  }
}

async function getWorkflowTasks() {
  if (!appId) {
    console.log('⚠️  No application ID, skipping workflow tasks');
    return;
  }
  
  try {
    console.log('\n📝 Getting workflow tasks...');
    const response = await axios.get(`${API_BASE}/scholarship/${appId}/workflow/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const tasks = response.data.data || response.data || [];
    if (tasks.length > 0) {
      console.log(`✅ Found ${tasks.length} task(s):`);
      tasks.forEach((task, i) => {
        console.log(`   ${i+1}. ${task.name} (ID: ${task.id})`);
      });
      return tasks;
    } else {
      console.log('⚠️  No tasks found');
      return [];
    }
  } catch (error) {
    console.error('❌ Failed to get tasks:', error.response?.data || error.message);
    return [];
  }
}

async function getProcessStatus() {
  if (!appId) {
    console.log('⚠️  No application ID, skipping process status');
    return;
  }
  
  try {
    console.log('\n📝 Getting process status...');
    const response = await axios.get(`${API_BASE}/scholarship/${appId}/workflow/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Process status:');
    console.log('   - ID: ' + response.data.id);
    console.log('   - Ended: ' + response.data.ended);
    console.log('   - Suspended: ' + response.data.suspended);
    if (response.data.variables) {
      console.log('   - Variables:');
      Object.entries(response.data.variables).forEach(([k, v]) => {
        console.log(`       ${k}: ${v}`);
      });
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.data?.message?.includes('no active Flowable process')) {
      console.log('⚠️  Application has no active Flowable process');
      return null;
    }
    console.error('❌ Failed to get status:', error.response?.data || error.message);
    return null;
  }
}

async function checkFlowableProcesses() {
  try {
    console.log('\n📝 Checking Flowable processes...');
    const response = await axios.get(`${FLOWABLE_URL}/runtime/process-instances`, {
      auth: { username: 'admin', password: 'test' }
    });
    
    const instances = response.data.data || [];
    console.log(`✅ Found ${instances.length} running process instance(s)`);
    instances.slice(0, 3).forEach((instance, i) => {
      console.log(`   ${i+1}. ${instance.id}`);
    });
    
    return instances;
  } catch (error) {
    console.error('❌ Failed to check processes:', error.message);
    return [];
  }
}

async function runTests() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 FLOWABLE INTEGRATION TEST SUITE');
    console.log('='.repeat(60));
    
    await getToken();
    await submitScholarship();
    await getProcessStatus();
    const tasks = await getWorkflowTasks();
    await checkFlowableProcesses();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
