/**
 * id-renewal.js
 */

const API_BASE = 'http://localhost:3000';
const token = localStorage.getItem('access_token');

if (!token) {
    window.location.href = 'login.html';
}

// Decode JWT helper
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
}

const decoded = parseJwt(token);
const roles = decoded?.realm_access?.roles || [];
const username = decoded?.preferred_username || 'User';

document.getElementById('userInfo').innerText = `Hello, ${username}`;
document.getElementById('roleWelcome').innerText = `Logged in as: ${roles.join(', ')}`;

// Role Visibility
if (roles.includes('citizen')) {
    document.getElementById('citizenView').style.display = 'block';
}
if (roles.includes('supervisor') || roles.includes('admin')) {
    document.getElementById('staffView').style.display = 'block';
    loadTasks();
    loadAllRequests();
}
if (roles.includes('admin')) {
    document.getElementById('adminView').style.display = 'block';
}

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
}

// Citizen: Submit Request
document.getElementById('renewalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        firstName: document.getElementById('fn').value,
        lastName: document.getElementById('ln').value,
        nationalId: document.getElementById('nid').value
    };

    try {
        const res = await fetch(`${API_BASE}/id-renewal`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            alert(`Request submitted! ID: ${data.id}`);
            document.getElementById('renewalForm').reset();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (err) {
        alert('Failed to submit request.');
    }
});

// Citizen: Track Request
async function trackRequest() {
    const id = document.getElementById('trackId').value;
    if (!id) return;
    try {
        const res = await fetch(`${API_BASE}/id-renewal/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const resultDiv = document.getElementById('trackResult');
        if (res.ok) {
            resultDiv.innerHTML = `
                <div class="badge ${data.status.toLowerCase()}">${data.status}</div>
                <p style="margin-top:0.5rem;">Citizen: ${data.firstName} ${data.lastName}</p>
                ${data.rejectionReason ? `<p style="color:red;">Reason: ${data.rejectionReason}</p>` : ''}
            `;
        } else {
            resultDiv.innerHTML = `<p style="color:red;">Request not found.</p>`;
        }
    } catch (err) {
        alert('Tracking failed.');
    }
}

// Staff: Load Tasks
async function loadTasks() {
    try {
        const res = await fetch(`${API_BASE}/id-renewal/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await res.json();
        const body = document.getElementById('tasksBody');
        body.innerHTML = '';
        tasks.forEach(task => {
            const row = `
                <tr>
                    <td>${task.id}</td>
                    <td>${task.variables?.citizenName || 'N/A'}</td>
                    <td>${task.variables?.nationalId || 'N/A'}</td>
                    <td>
                        <button onclick="approveTask('${task.id}', true)" class="btn btn-primary btn-sm">Approve</button>
                        <button onclick="openRejectDialog('${task.id}')" class="btn btn-outline btn-sm">Reject</button>
                    </td>
                </tr>
            `;
            body.innerHTML += row;
        });
    } catch (err) {}
}

async function approveTask(taskId, approved, reason = '') {
    try {
        const res = await fetch(`${API_BASE}/id-renewal/tasks/${taskId}/complete`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ approved, reason })
        });
        if (res.ok) {
            alert(approved ? 'Approved!' : 'Rejected!');
            loadTasks();
            loadAllRequests();
        } else {
            const err = await res.json();
            alert(`Error: ${err.message}`);
        }
    } catch (err) {
        alert('Action failed.');
    }
}

function openRejectDialog(taskId) {
    const reason = prompt('Enter rejection reason:');
    if (reason !== null) {
        approveTask(taskId, false, reason);
    }
}

// Staff: Load All Requests
async function loadAllRequests() {
    try {
        const res = await fetch(`${API_BASE}/id-renewal`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = await res.json();
        const body = document.getElementById('requestsBody');
        body.innerHTML = '';
        items.forEach(item => {
            body.innerHTML += `
                <tr>
                    <td>${item.id.substring(0,8)}...</td>
                    <td>${item.firstName} ${item.lastName}</td>
                    <td><span class="badge ${item.status.toLowerCase()}">${item.status}</span></td>
                </tr>
            `;
        });
    } catch (err) {}
}

// Admin: Deploy BPMN
async function deployBpmn() {
    try {
        const res = await fetch(`${API_BASE}/id-renewal/deploy`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('BPMN Deployed Successfully!');
        } else {
            alert('Deployment failed.');
        }
    } catch (err) {
        alert('Server unreachable.');
    }
}
