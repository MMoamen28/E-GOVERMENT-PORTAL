/**
 * register.js
 */

const API_BASE = 'http://localhost:3000/auth';

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('alertBox');
    const btn = document.getElementById('regBtn');
    
    const data = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };

    btn.disabled = true;
    btn.innerText = 'Creating account...';

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('successCard').style.display = 'block';
            alertBox.style.display = 'none';
        } else {
            const err = await res.json();
            alertBox.innerText = err.message || 'Registration failed';
            alertBox.className = 'alert-box error';
            alertBox.style.display = 'flex';
        }
    } catch (err) {
        alertBox.innerText = 'Cannot connect to server. Check if NestJS is running.';
        alertBox.className = 'alert-box error';
        alertBox.style.display = 'flex';
    } finally {
        btn.disabled = false;
        btn.innerText = 'Register';
    }
});
