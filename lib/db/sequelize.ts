import mysql2 from "mysql2";
import { Sequelize } from "sequelize";

const globalForSequelize = globalThis as unknown as {
  sequelize: Sequelize | undefined;
};

interface MysqlConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/** Removes wrapping quotes Vercel/.env copies often keep. */
function stripWrappingQuotes(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

/** Parses DATABASE_URL so Sequelize never sees Aiven query params (ssl-mode). */
function parseMysqlUrl(raw: string): MysqlConnection {
  const databaseUrl = stripWrappingQuotes(raw);
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid MySQL URL");
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")).split("/")[0] ?? "";
  if (!parsed.hostname || !database) {
    throw new Error("DATABASE_URL is not a valid MySQL URL");
  }
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    database,
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

/** TLS for hosted MySQL (Aiven); localhost stays plain. */
function dialectOptions(host: string) {
  const local = host === "localhost" || host === "127.0.0.1";
  return {
    charset: "utf8mb4",
    ...(local ? {} : { ssl: { rejectUnauthorized: false } }),
  };
}

function createSequelize(): Sequelize {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
  const conn = parseMysqlUrl(raw);

  return new Sequelize(conn.database, conn.username, conn.password, {
    host: conn.host,
    port: conn.port,
    dialect: "mysql",
    dialectModule: mysql2,
    logging: false,
    dialectOptions: dialectOptions(conn.host),
    define: {
      underscored: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  });
}

/** Returns a process-wide Sequelize client so serverless invocations reuse the pool. */
export function getSequelize(): Sequelize {
  if (!globalForSequelize.sequelize) {
    globalForSequelize.sequelize = createSequelize();
  }

  return globalForSequelize.sequelize;
}
