/**
 * ID Renewal Page — API Integration
 * Connects to NestJS API at http://localhost:3000
 * Handles form submission, status lookup, and UI feedback
 */

const API_BASE = 'http://localhost:3000';

/* ------------------------------------------------------------------ */
/* Utility helpers                                                      */
/* ------------------------------------------------------------------ */

function getToken() {
  return (document.getElementById('bearerToken')?.value || '').trim();
}

function buildHeaders(includeContentType = true) {
  const headers = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

/* ------------------------------------------------------------------ */
/* Progress step helpers                                                */
/* ------------------------------------------------------------------ */

function setProgressStep(step) {
  // step: 1, 2, or 3
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    if (!el) continue;
    el.classList.remove('active', 'done');
    if (i < step) el.classList.add('done');
    else if (i === step) el.classList.add('active');
  }
}

/* ------------------------------------------------------------------ */
/* Token field toggle                                                   */
/* ------------------------------------------------------------------ */

document.getElementById('tokenToggle')?.addEventListener('click', () => {
  const input = document.getElementById('bearerToken');
  const icon = document.querySelector('#tokenToggle i');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon?.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon?.classList.replace('fa-eye-slash', 'fa-eye');
  }
});

/* ------------------------------------------------------------------ */
/* Form validation                                                      */
/* ------------------------------------------------------------------ */

function validateField(id, errorId, condition, errorMsg) {
  const input = document.getElementById(id);
  const group = document.getElementById(`group-${id}`);
  const errEl = document.getElementById(errorId);
  const valid = condition(input?.value || '');
  if (!valid) {
    group?.classList.add('error');
    if (errEl) {
      errEl.textContent = errorMsg;
      errEl.style.display = 'block';
    }
  } else {
    group?.classList.remove('error');
    if (errEl) errEl.style.display = 'none';
  }
  return valid;
}

function validateForm() {
  const v1 = validateField(
    'firstName', 'err-firstName',
    v => v.trim().length > 0 && v.trim().length <= 50,
    'First name is required (max 50 characters).',
  );
  const v2 = validateField(
    'lastName', 'err-lastName',
    v => v.trim().length > 0 && v.trim().length <= 50,
    'Last name is required (max 50 characters).',
  );
  const v3 = validateField(
    'nationalId', 'err-nationalId',
    v => v.trim().length > 0,
    'National ID number is required.',
  );
  return v1 && v2 && v3;
}

// Live validation on blur
['firstName', 'lastName', 'nationalId'].forEach(id => {
  document.getElementById(id)?.addEventListener('blur', () => {
    validateField(id, `err-${id}`,
      v => id === 'nationalId' ? v.trim().length > 0 : v.trim().length > 0 && v.trim().length <= 50,
      id === 'nationalId' ? 'National ID number is required.' : `${id === 'firstName' ? 'First' : 'Last'} name is required (max 50 characters).`
    );
  });
  // Clear error on typing
  document.getElementById(id)?.addEventListener('input', () => {
    document.getElementById(`group-${id}`)?.classList.remove('error');
    const errEl = document.getElementById(`err-${id}`);
    if (errEl) errEl.style.display = 'none';
  });
});

/* ------------------------------------------------------------------ */
/* Submission result renderer                                           */
/* ------------------------------------------------------------------ */

function showSubmissionResult(type, title, message, requestId = null) {
  const el = document.getElementById('submissionResult');
  if (!el) return;

  const idSection = requestId ? `
    <div class="request-id-box">
      <code id="copiedId">${requestId}</code>
      <button class="copy-btn" title="Copy Request ID" onclick="copyToClipboard('${requestId}');this.innerHTML='<i class=\\'fas fa-check\\'></i>';setTimeout(()=>this.innerHTML='<i class=\\'fas fa-copy\\'></i>',2000)">
        <i class="fas fa-copy"></i>
      </button>
    </div>
    <p style="font-size:0.82rem;color:var(--text-light);margin-top:0.5rem;">
      <i class="fas fa-info-circle"></i> Save this ID to track your request on the right panel.
    </p>
  ` : '';

  el.className = `submission-result ${type}`;
  el.innerHTML = `
    <div class="result-icon">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
    </div>
    <h4>${title}</h4>
    <p style="font-size:0.9rem;color:var(--text-light);margin-bottom:${requestId ? '0.5rem' : '0'};">${message}</p>
    ${idSection}
  `;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Pre-fill the tracker with the new request id
  if (requestId) {
    const trackInput = document.getElementById('trackId');
    if (trackInput) trackInput.value = requestId;
  }
}

/* ------------------------------------------------------------------ */
/* Form submission                                                      */
/* ------------------------------------------------------------------ */

document.getElementById('renewalForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('submitSpinner');
  const btnText = submitBtn?.querySelector('.btn-text');

  // Set loading state
  if (submitBtn) submitBtn.disabled = true;
  if (spinner) spinner.style.display = 'inline';
  if (btnText) btnText.style.display = 'none';
  setProgressStep(2);

  const payload = {
    firstName: document.getElementById('firstName').value.trim(),
    lastName:  document.getElementById('lastName').value.trim(),
    nationalId: document.getElementById('nationalId').value.trim(),
  };

  try {
    const response = await fetch(`${API_BASE}/id-renewal`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      setProgressStep(3);
      showSubmissionResult(
        'success',
        '✅ Request Submitted Successfully',
        `Your ID renewal request has been received and is now under review. Status: <strong>${data.status || 'PENDING'}</strong>`,
        data.id,
      );
      document.getElementById('renewalForm')?.reset();
    } else if (response.status === 422) {
      // Name validation failed by GoRules
      setProgressStep(1);
      showSubmissionResult(
        'error',
        '⚠️ Name Validation Failed',
        data.message || 'Your name did not pass the validation check. Please review your first and last name.',
      );
    } else if (response.status === 401 || response.status === 403) {
      setProgressStep(1);
      showSubmissionResult(
        'error',
        '🔒 Authentication Required',
        'You need a valid citizen Bearer Token to submit a request. Please login to Keycloak and paste your token above.',
      );
    } else {
      setProgressStep(1);
      showSubmissionResult(
        'error',
        'Submission Failed',
        data.message || `Server returned ${response.status}. Please try again.`,
      );
    }
  } catch (err) {
    setProgressStep(1);
    showSubmissionResult(
      'error',
      '🔌 Connection Error',
      `Could not reach the API at <code>${API_BASE}</code>. Make sure Docker services are running and the NestJS API is started.<br><small>${err.message}</small>`,
    );
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.style.display = 'inline';
  }
});

/* ------------------------------------------------------------------ */
/* Status tracker                                                       */
/* ------------------------------------------------------------------ */

function renderStatusTimeline(status) {
  const tl1 = document.getElementById('tl-submitted');
  const tl2 = document.getElementById('tl-review');
  const tl3 = document.getElementById('tl-decision');
  const conn1 = document.getElementById('tl-conn-1');
  const conn2 = document.getElementById('tl-conn-2');

  // Reset
  [tl1, tl2, tl3].forEach(el => el?.classList.remove('active', 'done', 'approved', 'rejected'));
  [conn1, conn2].forEach(el => el?.classList.remove('active'));

  if (!status) return;

  tl1?.classList.add('done');

  if (status === 'PENDING') {
    conn1?.classList.add('active');
    tl2?.classList.add('active');
  } else if (status === 'APPROVED') {
    conn1?.classList.add('active');
    conn2?.classList.add('active');
    tl2?.classList.add('done');
    tl3?.classList.add('done', 'approved');
    const icon = tl3?.querySelector('.tl-icon i');
    if (icon) { icon.className = 'fas fa-check'; }
  } else if (status === 'REJECTED') {
    conn1?.classList.add('active');
    conn2?.classList.add('active');
    tl2?.classList.add('done');
    tl3?.classList.add('rejected');
    const icon = tl3?.querySelector('.tl-icon i');
    if (icon) { icon.className = 'fas fa-times'; }
  }
}

function renderStatusCard(data) {
  const card = document.getElementById('statusCard');
  const badge = document.getElementById('statusBadge');
  const reqId = document.getElementById('statusId');
  const name = document.getElementById('statusName');
  const nid = document.getElementById('statusNationalId');
  const date = document.getElementById('statusDate');
  const wfId = document.getElementById('statusWorkflowId');
  const rejRow = document.getElementById('rejectionRow');
  const rejTxt = document.getElementById('statusRejection');

  if (!card) return;

  badge.textContent = data.status || '—';
  badge.className = `status-badge ${data.status || ''}`;
  reqId.textContent = data.id ? `ID: ${data.id.slice(0, 18)}…` : '';
  name.textContent = `${data.firstName || ''} ${data.lastName || ''}`.trim() || '—';
  nid.textContent = data.nationalId || '—';
  date.textContent = formatDate(data.submittedAt);
  wfId.textContent = data.workflowId || '—';

  if (data.rejectionReason) {
    rejRow.style.display = 'flex';
    rejTxt.textContent = data.rejectionReason;
  } else {
    rejRow.style.display = 'none';
  }

  renderStatusTimeline(data.status);
  card.style.display = 'block';
}

async function lookupStatus() {
  const trackId = document.getElementById('trackId')?.value.trim();
  const statusCard = document.getElementById('statusCard');
  const statusError = document.getElementById('statusError');
  const statusLoading = document.getElementById('statusLoading');

  if (!trackId) {
    if (statusError) {
      statusError.textContent = 'Please enter a Request ID.';
      statusError.style.display = 'block';
    }
    return;
  }

  // Reset UI
  if (statusCard) statusCard.style.display = 'none';
  if (statusError) statusError.style.display = 'none';
  if (statusLoading) statusLoading.style.display = 'block';

  try {
    const response = await fetch(`${API_BASE}/id-renewal/${encodeURIComponent(trackId)}`, {
      method: 'GET',
      headers: buildHeaders(false),
    });

    const data = await response.json();

    if (response.ok) {
      renderStatusCard(data);
    } else if (response.status === 404) {
      if (statusError) {
        statusError.innerHTML = `<i class="fas fa-search"></i> No renewal request found for ID <strong>${trackId}</strong>.`;
        statusError.style.display = 'block';
      }
    } else if (response.status === 401 || response.status === 403) {
      if (statusError) {
        statusError.innerHTML = '<i class="fas fa-lock"></i> Authentication required to view this request. Add your Bearer Token above.';
        statusError.style.display = 'block';
      }
    } else {
      if (statusError) {
        statusError.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${data.message || 'Failed to retrieve request.'}`;
        statusError.style.display = 'block';
      }
    }
  } catch (err) {
    if (statusError) {
      statusError.innerHTML = `<i class="fas fa-wifi"></i> Could not reach the API. Make sure services are running.<br><small>${err.message}</small>`;
      statusError.style.display = 'block';
    }
  } finally {
    if (statusLoading) statusLoading.style.display = 'none';
  }
}

document.getElementById('trackBtn')?.addEventListener('click', lookupStatus);

document.getElementById('trackId')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') lookupStatus();
});

/* ------------------------------------------------------------------ */
/* Navbar mobile toggle (re-use from script.js but safe to repeat)     */
/* ------------------------------------------------------------------ */

const navToggleBtn = document.getElementById('nav-toggle');
const navMenuEl   = document.getElementById('nav-menu');

navToggleBtn?.addEventListener('click', () => {
  navMenuEl?.classList.toggle('active');
});
