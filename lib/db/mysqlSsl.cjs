/** True when the URL points at this machine (no TLS). */
function isLocalMysql(databaseUrl) {
  try {
    const host = new URL(databaseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return /@localhost\b|@127\.0\.0\.1\b/.test(databaseUrl);
  }
}

/** mysql2 options: utf8mb4 always; TLS for hosted MySQL (Aiven). */
function mysqlDialectOptions(databaseUrl) {
  const options = { charset: "utf8mb4" };
  if (!isLocalMysql(databaseUrl)) {
    // Aiven's CA is not in the default trust store; traffic is still TLS.
    options.ssl = { rejectUnauthorized: false };
  }
  return options;
}

module.exports = { mysqlDialectOptions };
