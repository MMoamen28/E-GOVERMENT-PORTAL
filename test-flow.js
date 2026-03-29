const http = require('http');
function req(opts, body) {
  return new Promise((res, rej) => {
    const r = http.request(opts, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => res({ s: resp.statusCode, b: d }));
    });
    r.on('error', rej);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  const BASE = { hostname: 'localhost', port: 3000 };
  const FLOAUTH = {
    Authorization: 'Basic ' + Buffer.from('rest-admin:test').toString('base64'),
  };

  console.log('=== STEP 1: Citizen Login ===');
  const lb = JSON.stringify({ username: 'ahmed.test', password: 'Test1234!' });
  const login = await req(
    {
      ...BASE,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(lb),
      },
    },
    lb,
  );
  const citizenToken = JSON.parse(login.b).access_token;
  console.log(
    'Login:',
    login.s === 201 ? 'OK' : 'FAIL',
    '| Token:',
    citizenToken ? 'yes' : 'no',
  );

  console.log('\n=== STEP 2: Submit Renewal Request ===');
  const rb = JSON.stringify({
    firstName: 'Ahmed',
    lastName: 'Hassan',
    nationalId: '29901011234567',
  });
  const renew = await req(
    {
      ...BASE,
      path: '/id-renewal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + citizenToken,
        'Content-Length': Buffer.byteLength(rb),
      },
    },
    rb,
  );
  const request = JSON.parse(renew.b);
  console.log('Submit:', renew.s === 201 ? 'OK' : 'FAIL');
  console.log('Request ID:', request.id);
  console.log('Status:', request.status);
  console.log('WorkflowId:', request.workflowId || '(missing)');

  console.log('\n=== STEP 3: Check Flowable Task Created ===');
  await new Promise((r) => setTimeout(r, 1000));
  const tasksRes = await req({
    hostname: 'flowable',
    port: 8080,
    path: '/flowable-rest/service/runtime/tasks?candidateGroup=supervisor',
    headers: FLOAUTH,
  });
  const taskList = JSON.parse(tasksRes.b).data || [];
  console.log('Tasks for supervisor:', taskList.length);
  const task = taskList[0];
  if (task)
    console.log(
      'Task ID:',
      task.id,
      '| Process Instance:',
      task.processInstanceId,
    );

  console.log('\n=== STEP 4: Supervisor Login + Approve ===');
  if (!task) {
    console.log('No task found');
    return;
  }
  const sl = JSON.stringify({
    username: 'supervisor.test',
    password: 'Test1234!',
  });
  const supLogin = await req(
    {
      ...BASE,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sl),
      },
    },
    sl,
  );
  const supToken = JSON.parse(supLogin.b).access_token;
  console.log(
    'Supervisor login:',
    supLogin.s === 201
      ? 'OK'
      : 'FAIL (create supervisor user in Keycloak first)',
  );
  if (!supToken) {
    console.log(
      'Skipping approval - create supervisor user in Keycloak admin with supervisor role',
    );
    return;
  }

  const ab = JSON.stringify({ approved: true, reason: '' });
  const approve = await req(
    {
      ...BASE,
      path: '/id-renewal/tasks/' + task.id + '/complete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + supToken,
        'Content-Length': Buffer.byteLength(ab),
      },
    },
    ab,
  );
  console.log(
    'Approve:',
    approve.s === 200 ? 'OK' : 'FAIL',
    approve.b.substring(0, 150),
  );

  console.log('\n=== STEP 5: Citizen Tracks Request ===');
  const track = await req({
    ...BASE,
    path: '/id-renewal/' + request.id,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + citizenToken },
  });
  const tracked = JSON.parse(track.b);
  console.log('Track:', track.s === 200 ? 'OK' : 'FAIL');
  console.log('Final Status:', tracked.status);
  console.log('\n=== TEST COMPLETE ===');
}
main().catch(console.error);
