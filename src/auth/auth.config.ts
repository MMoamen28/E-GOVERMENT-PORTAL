export default () => ({
  keycloak: {
    issuer:
      process.env.KEYCLOAK_ISSUER ??
      'http://localhost:8080/realms/e-gov-portal',
    internalUrl:
      process.env.KEYCLOAK_INTERNAL_URL ??
      'http://keycloak:8080/realms/e-gov-portal',
    audience: process.env.KEYCLOAK_AUDIENCE ?? 'account',
    jwksUri:
      process.env.KEYCLOAK_JWKS_URI ??
      'http://keycloak:8080/realms/e-gov-portal/protocol/openid-connect/certs',
  },
});
