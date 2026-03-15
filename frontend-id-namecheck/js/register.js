/**
 * register.js — Keycloak Registration Integration
 * Flow:
 *  1. Get admin token from master realm
 *  2. Create user in egov-portal realm (emailVerified:true)
 *  3. Fetch user ID from response header / GET by username
 *  4. Fetch citizen role ID
 *  5. Assign citizen role to user
 */

const KC_BASE       = 'http://localhost:8080';
const KC_REALM      = 'egov-portal';
const KC_ADMIN_USER = 'admin';
const KC_ADMIN_PASS = 'admin';

/* ── UI helpers ─────────────────────────────────────────────── */

function showAlert(type, icon, msg) {
  const box  = document.getElementById('alertBox');
  const ico  = document.getElementById('alertIcon');
  const text = document.getElementById('alertMsg');
  box.className  = `alert-box ${type}`;
  ico.innerHTML  = `<i class="fas ${icon}"></i>`;
  text.innerHTML = msg;
  box.style.display = 'flex';
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  document.getElementById('alertBox').style.display = 'none';
}

function setStep(n) {
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById(`rs${i}`);
    const line = document.getElementById(`rsLine${i}`);
    step?.classList.remove('active', 'done');
    if (i < n)  { step?.classList.add('done'); line?.classList.add('done'); }
    if (i === n) step?.classList.add('active');
    if (line && i >= n) line.classList.remove('done');
  }
}

function setLoading(on) {
  const btn     = document.getElementById('registerBtn');
  const text    = document.getElementById('btnText') || btn?.querySelector('.btn-text');
  const spinner = document.getElementById('regSpinner');
  if (btn)    btn.disabled = on;
  if (spinner) spinner.style.display = on ? 'inline' : 'none';
  const t = btn?.querySelector('.btn-text');
  if (t)  t.style.display = on ? 'none' : 'inline';
}

function showSuccess(username) {
  document.getElementById('registerForm').style.display  = 'none';
  document.getElementById('regSteps').style.display      = 'none';
  document.getElementById('alertBox').style.display      = 'none';
  document.getElementById('successCard').style.display   = 'block';
  document.getElementById('successMsg').textContent =
    `Welcome, ${username}! Your citizen account is ready. You can now log in and submit ID renewal requests.`;
}

/* ── Validation ─────────────────────────────────────────────── */

function validateField(id, grpId, errId, condition, msg) {
  const val   = document.getElementById(id)?.value.trim();
  const grp   = document.getElementById(grpId);
  const errEl = document.getElementById(errId);
  const ok    = condition(val);
  grp?.classList.toggle('error', !ok);
  if (errEl) errEl.style.display = ok ? 'none' : 'block';
  return ok;
}

function validateAll() {
  const pw = document.getElementById('password')?.value || '';
  const v1 = validateField('firstName', 'grp-firstName', 'err-firstName',
    v => v.length > 0, 'First name is required.');
  const v2 = validateField('lastName', 'grp-lastName', 'err-lastName',
    v => v.length > 0, 'Last name is required.');
  const v3 = validateField('username', 'grp-username', 'err-username',
    v => /^[a-zA-Z0-9._-]{3,50}$/.test(v), 'Username: 3-50 chars, letters/numbers/dots only.');
  const v4 = validateField('email', 'grp-email', 'err-email',
    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Valid email required.');
  const v5 = validateField('password', 'grp-password', 'err-password',
    v => v.length >= 8, 'Password must be at least 8 characters.');
  const v6 = validateField('confirmPassword', 'grp-confirmPassword', 'err-confirmPassword',
    v => v === pw, 'Passwords do not match.');
  return v1 && v2 && v3 && v4 && v5 && v6;
}

/* ── Password strength ──────────────────────────────────────── */

document.getElementById('password')?.addEventListener('input', () => {
  const pw    = document.getElementById('password').value;
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  let score   = 0;
  if (pw.length >= 8)               score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^a-zA-Z0-9]/.test(pw))     score++;

  const levels = [
    { w: '0%',   bg: '#e2e8f0', txt: '' },
    { w: '25%',  bg: '#dc2626', txt: 'Weak' },
    { w: '50%',  bg: '#d97706', txt: 'Fair' },
    { w: '75%',  bg: '#2563eb', txt: 'Good' },
    { w: '100%', bg: '#059669', txt: 'Strong' },
  ];
  const level = levels[score] || levels[0];
  fill.style.width      = level.w;
  fill.style.background = level.bg;
  label.textContent     = level.txt;
  label.style.color     = level.bg;
});

/* ── Show/hide password toggles ─────────────────────────────── */

function setupToggle(btnId, inputId) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    const icon  = document.querySelector(`#${btnId} i`);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon?.classList.toggle('fa-eye');
    icon?.classList.toggle('fa-eye-slash');
  });
}
setupToggle('pwToggle',  'password');
setupToggle('cpwToggle', 'confirmPassword');

/* ── Live field validation on blur ─────────────────────────── */

['firstName','lastName','username','email','password','confirmPassword'].forEach(id => {
  document.getElementById(id)?.addEventListener('blur', validateAll);
  document.getElementById(id)?.addEventListener('input', () => {
    document.getElementById(`grp-${id}`)?.classList.remove('error');
  });
});

/* ── Keycloak API calls ─────────────────────────────────────── */

async function getAdminToken() {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id:  'admin-cli',
    username:   KC_ADMIN_USER,
    password:   KC_ADMIN_PASS,
  });
  const res = await fetch(
    `${KC_BASE}/realms/master/protocol/openid-connect/token`,
    { method: 'POST', body: params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Admin auth failed (${res.status}): ${t}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createUser(token, { firstName, lastName, username, email, password }) {
  const res = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}/users`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        firstName,
        lastName,
        enabled:        true,
        emailVerified:  true,          // prevents "account not fully set up" error
        credentials: [{
          type:      'password',
          value:     password,
          temporary: false,
        }],
      }),
    }
  );

  if (res.status === 409) throw new Error('Username or email already exists in Keycloak.');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`User creation failed (${res.status}): ${t}`);
  }

  // Keycloak returns the new user ID in the Location header
  const location = res.headers.get('Location');
  if (location) {
    const parts = location.split('/');
    return parts[parts.length - 1];
  }

  // Fallback: fetch by username
  const listRes = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}/users?username=${encodeURIComponent(username)}&exact=true`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const users = await listRes.json();
  if (!users.length) throw new Error('User created but ID could not be retrieved.');
  return users[0].id;
}

async function getCitizenRoleId(token) {
  const res = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}/roles/citizen`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Could not fetch citizen role from Keycloak.');
  const role = await res.json();
  return { id: role.id, name: role.name };
}

async function assignCitizenRole(token, userId, role) {
  const res = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}/users/${userId}/role-mappings/realm`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify([role]),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Role assignment failed (${res.status}): ${t}`);
  }
}

/* ── Form submission ────────────────────────────────────────── */

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();
  if (!validateAll()) return;

  const firstName       = document.getElementById('firstName').value.trim();
  const lastName        = document.getElementById('lastName').value.trim();
  const username        = document.getElementById('username').value.trim();
  const email           = document.getElementById('email').value.trim();
  const password        = document.getElementById('password').value;

  setLoading(true);
  setStep(2);

  try {
    // Step 1 — Admin token
    showAlert('info', 'fa-circle-notch fa-spin', 'Getting admin authorization…');
    const adminToken = await getAdminToken();

    // Step 2 — Create user
    showAlert('info', 'fa-circle-notch fa-spin', 'Creating your account in Keycloak…');
    const userId = await createUser(adminToken, { firstName, lastName, username, email, password });

    // Step 3 — Assign citizen role
    showAlert('info', 'fa-circle-notch fa-spin', 'Assigning citizen role…');
    const citizenRole = await getCitizenRoleId(adminToken);
    await assignCitizenRole(adminToken, userId, citizenRole);

    // Done
    setStep(3);
    setLoading(false);
    showSuccess(username);

  } catch (err) {
    setStep(1);
    setLoading(false);
    let msg = err.message || 'An unexpected error occurred.';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Cannot reach Keycloak at <code>http://localhost:8080</code>. Make sure Docker services are running.';
    }
    showAlert('error', 'fa-times-circle', msg);
  }
});

/* ── Navbar mobile toggle ───────────────────────────────────── */

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-menu')?.classList.toggle('active');
});
