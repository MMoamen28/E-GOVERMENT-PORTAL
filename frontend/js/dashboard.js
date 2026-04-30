// Dashboard JS
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
      window.location.href = `./pages/login.html?return=dashboard.html`;
      return null;
    }

    const decoded = parseJwt(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('egov_token');
      localStorage.removeItem('egov_user');
      window.location.href = `./pages/login.html?return=dashboard.html`;
      return null;
    }

    return { token, decoded };
  }

  function getStatusColor(status) {
    if (status === 'PENDING') return '#ff9800';
    if (status === 'APPROVED') return '#4caf50';
    if (status === 'REJECTED') return '#f44336';
    return '#999';
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
  }

  async function loadIdRenewalRequests(auth) {
    try {
      const response = await fetch(`${API_BASE}/id-renewal/my-requests`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (!response.ok) {
        document.getElementById('id-renewal-error').textContent =
          'Failed to load ID Renewal requests';
        document.getElementById('id-renewal-error').style.display = 'block';
        return;
      }

      const requests = await response.json();
      const tbody = document.getElementById('id-renewal-tbody');

      if (!requests || requests.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: #999;">No submissions yet</td></tr>';
        return;
      }

      tbody.innerHTML = requests
        .map((req) => {
          return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">${req.id.substring(0, 8)}...</td>
            <td style="padding: 0.75rem;">${req.firstName} ${req.lastName}</td>
            <td style="padding: 0.75rem; color: white; background-color: ${getStatusColor(req.status)}; border-radius: 4px; text-align: center; font-weight: bold;">${req.status}</td>
            <td style="padding: 0.75rem;">${formatDate(req.submittedAt)}</td>
          </tr>
        `;
        })
        .join('');
    } catch (error) {
      document.getElementById('id-renewal-error').textContent =
        'Error: ' + error.message;
      document.getElementById('id-renewal-error').style.display = 'block';
    }
  }

  async function loadScholarshipRequests(auth) {
    try {
      const response = await fetch(`${API_BASE}/scholarship/my-requests`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (!response.ok) {
        document.getElementById('scholarship-error').textContent =
          'Failed to load Scholarship requests';
        document.getElementById('scholarship-error').style.display = 'block';
        return;
      }

      const requests = await response.json();
      const tbody = document.getElementById('scholarship-tbody');

      if (!requests || requests.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: #999;">No submissions yet</td></tr>';
        return;
      }

      tbody.innerHTML = requests
        .map((req) => {
          return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">${req.id.substring(0, 8)}...</td>
            <td style="padding: 0.75rem;">${req.university}</td>
            <td style="padding: 0.75rem;">${req.gpa}</td>
            <td style="padding: 0.75rem; color: white; background-color: ${getStatusColor(req.status)}; border-radius: 4px; text-align: center; font-weight: bold;">${req.status}</td>
            <td style="padding: 0.75rem;">${formatDate(req.createdAt)}</td>
          </tr>
        `;
        })
        .join('');
    } catch (error) {
      document.getElementById('scholarship-error').textContent =
        'Error: ' + error.message;
      document.getElementById('scholarship-error').style.display = 'block';
    }
  }

  async function loadBusinessLicenseRequests(auth) {
    try {
      const response = await fetch(`${API_BASE}/business-license/my-requests`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (!response.ok) {
        document.getElementById('business-license-error').textContent =
          'Failed to load Business License requests';
        document.getElementById('business-license-error').style.display =
          'block';
        return;
      }

      const requests = await response.json();
      const tbody = document.getElementById('business-license-tbody');

      if (!requests || requests.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: #999;">No submissions yet</td></tr>';
        return;
      }

      tbody.innerHTML = requests
        .map((req) => {
          return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">${req.id.substring(0, 8)}...</td>
            <td style="padding: 0.75rem;">${req.businessName}</td>
            <td style="padding: 0.75rem;">${req.businessType}</td>
            <td style="padding: 0.75rem; color: white; background-color: ${getStatusColor(req.status)}; border-radius: 4px; text-align: center; font-weight: bold;">${req.status}</td>
            <td style="padding: 0.75rem;">${formatDate(req.createdAt)}</td>
          </tr>
        `;
        })
        .join('');
    } catch (error) {
      document.getElementById('business-license-error').textContent =
        'Error: ' + error.message;
      document.getElementById('business-license-error').style.display = 'block';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;

    // Display user name
    const user = localStorage.getItem('egov_user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        document.getElementById('user-name').textContent =
          userData.username || userData.sub || 'User';
      } catch {}
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('egov_token');
      localStorage.removeItem('egov_user');
      window.location.href = './pages/login.html';
    });

    // Load all requests
    loadIdRenewalRequests(auth);
    loadScholarshipRequests(auth);
    loadBusinessLicenseRequests(auth);
  });
})();
