// Business License Frontend JS
(function () {
  const API_BASE =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : window.location.origin.replace(/:\d+$/, '') + ':3000';

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  function checkAuth() {
    const token = localStorage.getItem('egov_token');
    if (!token) {
      window.location.href = `login.html?return=business-license.html`;
      return null;
    }

    const decoded = parseJwt(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('egov_token');
      localStorage.removeItem('egov_user');
      window.location.href = `login.html?return=business-license.html`;
      return null;
    }

    return { token, decoded };
  }

  function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = msg;
    msgDiv.style.background = isError ? '#fee' : '#efe';
    msgDiv.style.color = isError ? '#c33' : '#3c3';
    msgDiv.style.display = 'block';
    setTimeout(() => (msgDiv.style.display = 'none'), 4000);
  }

  function validateForm() {
    const errors = [];
    const ownerName = document.getElementById('ownerName').value.trim();
    const businessName = document.getElementById('businessName').value.trim();
    const nationalId = document.getElementById('nationalId').value.trim();
    const businessType = document.getElementById('businessType').value;

    if (!ownerName) errors.push('Owner Name is required');
    if (!businessName) errors.push('Business Name is required');
    if (!nationalId) errors.push('National ID is required');
    if (!businessType) errors.push('Business Type is required');

    return errors;
  }

  async function submitForm(e) {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      showMessage(errors.join('; '), true);
      return;
    }

    const auth = checkAuth();
    if (!auth) return;

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    document.getElementById('btn-text').textContent = 'Submitting...';

    try {
      const response = await fetch(`${API_BASE}/business-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          ownerName: document.getElementById('ownerName').value.trim(),
          businessName: document.getElementById('businessName').value.trim(),
          nationalId: document.getElementById('nationalId').value.trim(),
          businessType: document.getElementById('businessType').value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(
          data.message || 'Failed to submit business license application',
          true,
        );
      } else {
        showMessage('Request submitted successfully — Status: PENDING');
        document.getElementById('business-license-form').reset();
        loadMyRequests(auth);
      }
    } catch (error) {
      showMessage('Error: ' + error.message, true);
    } finally {
      submitBtn.disabled = false;
      document.getElementById('btn-text').textContent = 'Submit Application';
    }
  }

  async function loadMyRequests(auth) {
    try {
      const response = await fetch(`${API_BASE}/business-license/my-requests`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        document.getElementById('requests-tbody').innerHTML =
          '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: red;">Failed to load requests</td></tr>';
        return;
      }

      const requests = await response.json();
      const tbody = document.getElementById('requests-tbody');

      if (!requests || requests.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: #999;">No submissions yet</td></tr>';
        return;
      }

      tbody.innerHTML = requests
        .map((req) => {
          const statusColor =
            req.status === 'PENDING'
              ? '#ff9800'
              : req.status === 'APPROVED'
                ? '#4caf50'
                : '#f44336';
          const date = new Date(req.createdAt).toLocaleDateString();
          return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">${req.id.substring(0, 8)}...</td>
            <td style="padding: 0.75rem;">${req.businessName}</td>
            <td style="padding: 0.75rem;">${req.businessType}</td>
            <td style="padding: 0.75rem; color: white; background-color: ${statusColor}; border-radius: 4px; text-align: center; font-weight: bold;">${req.status}</td>
            <td style="padding: 0.75rem;">${date}</td>
          </tr>
        `;
        })
        .join('');
    } catch (error) {
      document.getElementById('requests-tbody').innerHTML =
        '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: red;">Error loading requests</td></tr>';
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;

    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('egov_token');
      localStorage.removeItem('egov_user');
      window.location.href = 'login.html';
    });

    document
      .getElementById('business-license-form')
      .addEventListener('submit', submitForm);
    loadMyRequests(auth);
  });
})();
