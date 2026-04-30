/**
 * login.js
 */

const API_BASE = 'http://localhost:3000/auth';

function fillCreds(u, p) {
    document.getElementById('username').value = u;
    document.getElementById('password').value = p;
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('alertBox');
    const btn = document.getElementById('loginBtn');
    
    const data = {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    };

    if (!data.username || !data.password) return;

    btn.disabled = true;
    btn.innerText = 'Signing in...';

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const tokenData = await res.json();
            localStorage.setItem('access_token', tokenData.access_token);
            window.location.href = 'id-renewal.html';
        } else {
            alertBox.innerText = 'Invalid username or password';
            alertBox.className = 'alert-box error';
            alertBox.style.display = 'flex';
        }
    } catch (err) {
        alertBox.innerText = 'Cannot connect to server. Check if NestJS is running.';
        alertBox.className = 'alert-box error';
        alertBox.style.display = 'flex';
    } finally {
        btn.disabled = false;
        btn.innerText = 'Sign In';
    }
});
