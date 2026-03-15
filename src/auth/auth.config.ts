export default () => ({
  keycloak: {
    issuer: process.env.KEYCLOAK_ISSUER ?? 'http://localhost:8080/realms/e-gov-portal',
    audience: process.env.KEYCLOAK_AUDIENCE || undefined,
    jwksUri:
      process.env.KEYCLOAK_JWKS_URI ??
      'http://localhost:8080/realms/e-gov-portal/protocol/openid-connect/certs',
  },
});
