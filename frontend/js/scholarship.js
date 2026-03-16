/**
 * Scholarship dashboard: login, apply form, applications list, officer status actions.
 */
document.addEventListener('DOMContentLoaded', function () {
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      var icon = navToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
  }

  const token = window.EgovAuth.getToken();
  const user = window.EgovAuth.getStoredUser();
  const isOfficer = window.EgovAuth.isOfficerOrAdmin();

  const loginSection = document.getElementById('scholarship-login');
  const dashboardSection = document.getElementById('scholarship-dashboard');
  const logoutBtn = document.getElementById('auth-logout');
  const listTitle = document.getElementById('list-title');
  const thActions = document.getElementById('th-actions');

  function showDashboard() {
    var currentUser = window.EgovAuth.getStoredUser();
    var officerOrAdmin = window.EgovAuth.isOfficerOrAdmin();
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    var welcome = document.getElementById('welcome-msg');
    if (welcome && currentUser) welcome.textContent = 'Signed in as ' + (currentUser.username || currentUser.sub) + (officerOrAdmin ? ' (Officer/Admin)' : '') + '.';
    if (listTitle) listTitle.textContent = officerOrAdmin ? 'All applications' : 'My applications';
    if (thActions) thActions.style.display = officerOrAdmin ? 'table-cell' : 'none';
    var applyApplicantId = document.getElementById('apply-applicantId');
    if (applyApplicantId && currentUser) applyApplicantId.value = currentUser.sub || '';
    loadApplications();
  }

  function showLogin() {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  if (token && user) {
    showDashboard();
  } else {
    showLogin();
  }

  logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.EgovAuth.logout();
    showLogin();
  });

  // ——— Login form ———
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var username = document.getElementById('login-username').value.trim();
      var password = document.getElementById('login-password').value;
      var errEl = document.getElementById('login-error');
      if (errEl) errEl.style.display = 'none';
      var btn = this.querySelector('button[type="submit"]');
      var origText = btn ? btn.innerHTML : 'Sign in';
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…'; }
      try {
        await window.EgovAuth.login(username, password);
        showDashboard();
      } catch (err) {
        var msg = err.message || 'Login failed. Check username and password.';
        if (errEl) {
          errEl.textContent = msg;
          errEl.style.display = 'block';
        }
        console.error('Scholarship login error:', err);
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = origText; }
      }
    });
  }

  // ——— Check Eligibility ———
  const checkBtn = document.getElementById('btn-check-eligibility');
  const policyEl = document.getElementById('policy-result');

  if (checkBtn) {
    checkBtn.addEventListener('click', async function() {
      const applicantId = document.getElementById('apply-applicantId').value;
      const isStudent = document.getElementById('apply-isStudent').checked;
      
      policyEl.style.display = 'none';
      policyEl.classList.remove('active');
      policyEl.className = 'alert reveal';
      
      const origText = checkBtn.innerHTML;
      checkBtn.disabled = true;
      checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking…';

      try {
        const res = await window.EgovAuth.apiFetch('/policies/evaluate', {
          method: 'POST',
          body: JSON.stringify({ applicantId, isStudent }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || (res.status === 401 ? 'Session expired (Unauthorized)' : 'Error checking eligibility'));
        }
        
        const data = await res.json();
        console.log('Eligibility Data:', data);
        
        policyEl.textContent = (data.eligible ? '✅ ' : '❌ status: ') + (data.reason || 'Not eligible (no reason)');
        policyEl.classList.add(data.eligible ? 'alert-success' : 'alert-error');
        policyEl.style.display = 'block';
        // Force a reflow to trigger animation
        policyEl.offsetHeight; 
        policyEl.classList.add('active');
      } catch (err) {
        policyEl.textContent = 'Error checking eligibility.';
        policyEl.classList.add('alert-error');
        policyEl.style.display = 'block';
      } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = origText;
      }
    });
  }

  // ——— Apply form ———
  document.getElementById('applyForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const applicantId = document.getElementById('apply-applicantId').value;
    const gpa = parseFloat(document.getElementById('apply-gpa').value);
    const income = parseFloat(document.getElementById('apply-income').value);
    const achievements = document.getElementById('apply-achievements').checked;
    const isStudent = document.getElementById('apply-isStudent').checked;
    
    const successEl = document.getElementById('apply-success');
    const errorEl = document.getElementById('apply-error');
    const policyEl = document.getElementById('policy-result');

    successEl.style.display = 'none';
    errorEl.style.display = 'none';
    policyEl.style.display = 'none';

    const btn = this.querySelector('button[type="submit"]');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
    try {
      const res = await window.EgovAuth.apiFetch('/scholarship/apply', {
        method: 'POST',
        body: JSON.stringify({ applicantId, gpa, income, achievements, isStudent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Submit failed');
      }
      successEl.textContent = 'Application submitted successfully.';
      successEl.style.display = 'block';
      this.reset();
      document.getElementById('apply-applicantId').value = applicantId;
      loadApplications();
    } catch (err) {
      errorEl.textContent = err.message || 'Could not submit application.';
      errorEl.style.display = 'block';
    }
    btn.disabled = false;
    btn.innerHTML = origText;
  });

  // ——— Load applications ———
  function statusClass(s) {
    const v = (s || '').toLowerCase().replace(/\s/g, '_');
    return v || 'draft';
  }

  function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString();
  }

  async function loadApplications() {
    const loadingEl = document.getElementById('applications-loading');
    const emptyEl = document.getElementById('applications-empty');
    const tableWrap = document.getElementById('applications-table-wrap');
    const tbody = document.getElementById('applications-tbody');
    loadingEl.style.display = 'block';
    emptyEl.style.display = 'none';
    tableWrap.style.display = 'none';
    tbody.innerHTML = '';
    try {
      const res = await window.EgovAuth.apiFetch('/scholarship');
      if (res.status === 401) {
        loadingEl.style.display = 'none';
        emptyEl.innerHTML = 'Session not accepted by the server. You can still apply below, or <a href="#" id="sign-out-retry">sign out and sign in again</a>.';
        emptyEl.style.display = 'block';
        var signOutLink = document.getElementById('sign-out-retry');
        if (signOutLink) signOutLink.addEventListener('click', function (e) { e.preventDefault(); window.EgovAuth.logout(); showLogin(); });
        return;
      }
      if (!res.ok) throw new Error('Failed to load applications');
      const list = await res.json();
      loadingEl.style.display = 'none';
      if (!list || list.length === 0) {
        emptyEl.textContent = 'No applications yet. Submit one above.';
        emptyEl.style.display = 'block';
        return;
      }
      tableWrap.style.display = 'block';
      var isOfficerNow = window.EgovAuth.isOfficerOrAdmin();
      list.forEach(function (app) {
        var tr = document.createElement('tr');
        tr.dataset.id = app.id;
        tr.innerHTML =
          '<td>' + formatDate(app.createdAt) + '</td>' +
          '<td>' + (app.gpa != null ? app.gpa : '—') + '</td>' +
          '<td>' + (app.income != null ? app.income : '—') + '</td>' +
          '<td>' + (app.scholarshipLevel || '—') + '</td>' +
          '<td><span class="status-badge ' + statusClass(app.status) + '">' + (app.status || 'DRAFT') + '</span></td>' +
          (isOfficerNow ? '<td class="scholarship-actions" data-app-id="' + app.id + '" data-status="' + (app.status || '') + '"></td>' : '');
        tbody.appendChild(tr);
        if (isOfficerNow) {
          var actionsCell = tr.querySelector('.scholarship-actions');
          if (actionsCell) renderStatusButtons(actionsCell, app.id, app.status);
        }
      });
    } catch (err) {
      loadingEl.style.display = 'none';
      emptyEl.textContent = 'Error loading applications. Try again.';
      emptyEl.style.display = 'block';
    }
  }

  function renderStatusButtons(cell, appId, status) {
    cell.innerHTML = '';
    if (status === 'SUBMITTED') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary';
      btn.textContent = 'Start review';
      btn.dataset.action = 'start_review';
      btn.dataset.appId = appId;
      cell.appendChild(btn);
    }
    if (status === 'UNDER_REVIEW') {
      const approve = document.createElement('button');
      approve.type = 'button';
      approve.className = 'btn btn-primary';
      approve.textContent = 'Approve';
      approve.dataset.action = 'approve';
      approve.dataset.appId = appId;
      const reject = document.createElement('button');
      reject.type = 'button';
      reject.className = 'btn btn-outline';
      reject.style.color = 'var(--error)';
      reject.style.borderColor = 'var(--error)';
      reject.textContent = 'Reject';
      reject.dataset.action = 'reject';
      reject.dataset.appId = appId;
      cell.appendChild(approve);
      cell.appendChild(reject);
    }
    cell.querySelectorAll('button[data-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        updateStatus(this.dataset.appId, this.dataset.action);
      });
    });
  }

  async function updateStatus(appId, action) {
    const btn = event.target;
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';
    try {
      const res = await window.EgovAuth.apiFetch('/scholarship/' + appId + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ action: action }),
      });
      if (res.status === 401 || res.status === 403) {
        alert('Session expired or you do not have permission.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Update failed');
      }
      loadApplications();
    } catch (err) {
      alert(err.message || 'Could not update status.');
    }
    btn.disabled = false;
    btn.textContent = origText;
  }
});
