const axios = require('axios');

async function testAuth() {
    const API_BASE = 'http://localhost:3000/auth';
    const testUser = {
        firstName: 'Script',
        lastName: 'Test',
        username: 'script_user_' + Date.now(),
        email: 'script' + Date.now() + '@example.com',
        password: 'Password123!'
    };

    console.log('--- Testing Registration ---');
    try {
        const regRes = await axios.post(`${API_BASE}/register`, testUser);
        console.log('Registration Success:', regRes.data);
    } catch (err) {
        console.error('Registration Failed:', err.response ? err.response.data : err.message);
        return;
    }

    console.log('\n--- Testing Login ---');
    try {
        const loginRes = await axios.post(`${API_BASE}/login`, {
            username: testUser.username,
            password: testUser.password
        });
        console.log('Login Success! Token received.');
        const token = loginRes.data.access_token;

        console.log('\n--- Testing Profile (Roles Check) ---');
        const meRes = await axios.get(`${API_BASE}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile Data:', JSON.stringify(meRes.data, null, 2));

        console.log('\n--- Testing Scholarship My-Requests (403 Check) ---');
        try {
            const schRes = await axios.get('http://localhost:3000/scholarship/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Scholarship Access Success:', schRes.data);
        } catch (err) {
            console.error('Scholarship Access Failed (Should be 200/Empty List, not 403):', err.response ? err.response.status : err.message);
        }

    } catch (err) {
        console.error('Login Failed:', err.response ? err.response.data : err.message);
    }
}

testAuth();
