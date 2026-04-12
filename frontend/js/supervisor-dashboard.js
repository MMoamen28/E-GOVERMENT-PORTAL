// Supervisor Dashboard JS
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
      window.location.href = `./pages/login.html`;
      return null;
    }

    const decoded = parseJwt(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('egov_token');
      localStorage.removeItem('egov_user');
      window.location.href = `./pages/login.html`;
      return null;
    }

    // Check if supervisor role
    const roles = decoded.realm_access?.roles || [];
    if (!roles.includes('supervisor')) {
      window.location.href = `./pages/login.html`;
      return null;
    }

    return { token, decoded };
  }

  function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? '#f44336' : '#4caf50';
    toast.style.display = 'block';
    setTimeout(() => (toast.style.display = 'none'), 3000);
  }

  async function completeTask(service, requestId, taskId, action, element) {
    const auth = checkAuth();
    if (!auth) return;

    try {
      const response = await fetch(
        `${API_BASE}/${service}/${requestId}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ action, taskId }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        showToast(data.message || 'Failed to complete task', true);
        return;
      }

      showToast('Task completed successfully');
      element.style.opacity = '0.5';
      element.style.pointerEvents = 'none';
    } catch (error) {
      showToast('Error: ' + error.message, true);
    }
  }

  function createTaskCard(service, request, task) {
    let details = '';

    if (service === 'id-renewal') {
      details = `<p><strong>Name:</strong> ${request.firstName} ${request.lastName}</p><p><strong>National ID:</strong> ${request.nationalId}</p>`;
    } else if (service === 'scholarship') {
      details = `<p><strong>University:</strong> ${request.university}</p><p><strong>GPA:</strong> ${request.gpa}</p>`;
    } else if (service === 'business-license') {
      details = `<p><strong>Business:</strong> ${request.businessName}</p><p><strong>Type:</strong> ${request.businessType}</p>`;
    }

    return `
      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; background: #f9f9f9;">
        <h3 style="margin-top: 0;">${service.replace('-', ' ').toUpperCase()}</h3>
        ${details}
        <p><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-small" style="background: #4caf50; color: white; border: none; cursor: pointer; flex: 1;" onclick="approveTask('${service}', '${request.id}', '${task.id}', this.parentElement.parentElement)">
            Approve
          </button>
          <button class="btn btn-small" style="background: #f44336; color: white; border: none; cursor: pointer; flex: 1;" onclick="rejectTask('${service}', '${request.id}', '${task.id}', this.parentElement.parentElement)">
            Reject
          </button>
        </div>
      </div>
    `;
  }

  window.approveTask = function (service, requestId, taskId, element) {
    completeTask(service, requestId, taskId, 'APPROVED', element);
  };

  window.rejectTask = function (service, requestId, taskId, element) {
    completeTask(service, requestId, taskId, 'REJECTED', element);
  };

  async function loadIdRenewalTasks(auth) {
    try {
      const response = await fetch(`${API_BASE}/id-renewal/supervisor/tasks`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (!response.ok) return;

      const tasks = await response.json();
      const container = document.getElementById('id-renewal-tasks');

      if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p>No pending tasks</p>';
        return;
      }

      container.innerHTML = tasks
        .map((task) => {
          const request = {
            id: task.variables?.requestId || 'unknown',
            firstName: task.variables?.firstName || '',
            lastName: task.variables?.lastName || '',
            nationalId: task.variables?.nationalId || '',
            createdAt: task.created,
          };
          return createTaskCard('id-renewal', request, task);
        })
        .join('');
    } catch (error) {
      document.getElementById('id-renewal-tasks').innerHTML =
        '<p>Error loading tasks</p>';
    }
  }

  async function loadScholarshipTasks(auth) {
    try {
      const response = await fetch(`${API_BASE}/scholarship/supervisor/tasks`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (!response.ok) return;

      const tasks = await response.json();
      const container = document.getElementById('scholarship-tasks');

      if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p>No pending tasks</p>';
        return;
      }

      container.innerHTML = tasks
        .map((task) => {
          const request = {
            id: task.variables?.requestId || 'unknown',
            university: task.variables?.university || '',
            gpa: task.variables?.gpa || '',
            createdAt: task.created,
          };
          return createTaskCard('scholarship', request, task);
        })
        .join('');
    } catch (error) {
      document.getElementById('scholarship-tasks').innerHTML =
        '<p>Error loading tasks</p>';
    }
  }

  async function loadBusinessLicenseTasks(auth) {
    try {
      const response = await fetch(
        `${API_BASE}/business-license/supervisor/tasks`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      );

      if (!response.ok) return;

      const tasks = await response.json();
      const container = document.getElementById('business-license-tasks');

      if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p>No pending tasks</p>';
        return;
      }

      container.innerHTML = tasks
        .map((task) => {
          const request = {
            id: task.variables?.licenseId || 'unknown',
            businessName: task.variables?.businessName || '',
            businessType: task.variables?.businessType || '',
            createdAt: task.created,
          };
          return createTaskCard('business-license', request, task);
        })
        .join('');
    } catch (error) {
      document.getElementById('business-license-tasks').innerHTML =
        '<p>Error loading tasks</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;

    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('egov_token');
      localStorage.removeItem('egov_user');
      window.location.href = './pages/login.html';
    });

    loadIdRenewalTasks(auth);
    loadScholarshipTasks(auth);
    loadBusinessLicenseTasks(auth);
  });
})();
