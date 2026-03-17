/**
 * Scholarship frontend auth — Keycloak token (direct grant), localStorage, role check.
 * Token is used for API calls; backend validates JWT and roles.
 */
(function () {
  const STORAGE_TOKEN = 'egov_scholarship_token';
  const STORAGE_USER = 'egov_scholarship_user';

  const KEYCLOAK_REALM = 'e-gov-portal';
  const KEYCLOAK_CLIENT = 'scholarship-frontend';

  function keycloakBaseUrl() {
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? window.location.protocol + '//' + window.location.hostname + ':8080'
      : (window.location.origin.replace(/:\d+$/, '') + ':8080');
  }

  function keycloakTokenUrl() {
    return keycloakBaseUrl() + '/realms/' + KEYCLOAK_REALM + '/protocol/openid-connect/token';
  }

  /** Open Keycloak registration page; redirect back to current page after sign-up. */
  function openRegistration() {
    const redirectUri = encodeURIComponent(window.location.href);
    const url = keycloakBaseUrl() + '/realms/' + KEYCLOAK_REALM + '/protocol/openid-connect/registrations?client_id=' + KEYCLOAK_CLIENT + '&redirect_uri=' + redirectUri + '&response_type=code&scope=openid';
    window.location.href = url;
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
    openRegistration: openRegistration,

    async login(username, password) {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed (invalid credentials or server error)');
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
