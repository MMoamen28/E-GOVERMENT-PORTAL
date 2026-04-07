const fs = require('fs');

async function getAccessToken() {
  const url = 'http://localhost:8080/realms/e-gov-portal/protocol/openid-connect/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', 'scholarship-api');
  params.append('client_secret', 'scholarship-api-secret-change-in-production');
  params.append('username', 'applicant1');
  params.append('password', 'test123');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function submitApplication(token) {
  const url = 'http://localhost:3000/scholarship/apply';
  const body = {
    applicantId: 'applicant1-uuid',
    gpa: 3.8,
    income: 2000,
    achievements: true,
    isOrphan: false,
    isStudent: true,
    hasID: true,
    hasIncomeDoc: true,
    hasStudentCert: true,
    hasFamilyStatus: true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Failed to submit application: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log('Authenticating with Keycloak...');
    const token = await getAccessToken();
    console.log('Token obtained.');

    console.log('Submitting scholarship application...');
    const application = await submitApplication(token);
    console.log('Application submitted successfully!');
    console.log('Application ID:', application.id);
    console.log('Flowable Process Instance ID:', application.processInstanceId);

    if (application.processInstanceId) {
      console.log('SUCCESS: Application is linked to a Flowable process.');
    } else {
      console.log('WARNING: Application submitted but no Process Instance ID found. Check app logs.');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

main();
