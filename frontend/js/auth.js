/**
 * Scholarship frontend auth — Keycloak token (direct grant), localStorage, role check.
 * Token is used for API calls; backend validates JWT and roles.
 */
(function () {
  const STORAGE_TOKEN = 'egov_scholarship_token';
  const STORAGE_USER = 'egov_scholarship_user';

  function keycloakTokenUrl() {
    const base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.protocol}//${window.location.hostname}:8080`
      : `${window.location.origin.replace(/:\d+$/, '')}:8080`;
    return `${base}/realms/e-gov-portal/protocol/openid-connect/token`;
  }

  function decodeJwtPayload(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload;
    } catch (_) {
      return null;
    }
  }

  window.EgovAuth = {
    getTokenUrl: keycloakTokenUrl,

    async login(username, password) {
      const url = keycloakTokenUrl();
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: 'scholarship-frontend',
        username: username,
        password: password,
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(function () { controller.abort(); }, 15000);
      var res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          signal: controller.signal,
        });
      } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error('Keycloak did not respond. Is it running at ' + url + '?');
        throw new Error(e.message || 'Network error. Check Keycloak is running (port 8080) and CORS allows this origin.');
      }
      clearTimeout(timeoutId);
      if (!res.ok) {
        const err = await res.json().catch(function () { return {}; });
        throw new Error(err.error_description || err.error || 'Login failed (invalid credentials or Keycloak error)');
      }
      const data = await res.json();
      const payload = decodeJwtPayload(data.access_token);
      const user = {
        sub: payload?.sub,
        username: payload?.preferred_username || username,
        roles: payload?.realm_access?.roles || [],
      };
      localStorage.setItem(STORAGE_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
      return user;
    },

    logout() {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
    },

    getToken() {
      return localStorage.getItem(STORAGE_TOKEN);
    },

    getStoredUser() {
      const raw = localStorage.getItem(STORAGE_USER);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (_) {
        return null;
      }
    },

    hasRole(role) {
      const user = this.getStoredUser();
      return user && user.roles && user.roles.includes(role);
    },

    isOfficerOrAdmin() {
      return this.hasRole('officer') || this.hasRole('admin');
    },

    apiFetch(path, options = {}) {
      const token = this.getToken();
      const headers = { ...options.headers, 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return fetch(path, { ...options, headers });
    },
  };
})();
