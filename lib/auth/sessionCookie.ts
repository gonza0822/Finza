/** Auth.js session cookie name. Edge-safe: no Sequelize import. */
export function getSessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}
