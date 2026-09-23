import { Sequelize } from "sequelize";

const globalForSequelize = globalThis as unknown as {
  sequelize: Sequelize | undefined;
};

/** TLS for hosted MySQL (Aiven); localhost stays plain. */
function dialectOptions(databaseUrl: string) {
  let host = "";
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    host = "";
  }
  const local = host === "localhost" || host === "127.0.0.1";
  return {
    charset: "utf8mb4",
    ...(local ? {} : { ssl: { rejectUnauthorized: false } }),
  };
}

function createSequelize(): Sequelize {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Sequelize(databaseUrl, {
    dialect: "mysql",
    logging: false,
    dialectOptions: dialectOptions(databaseUrl),
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
