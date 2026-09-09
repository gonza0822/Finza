import { Sequelize } from "sequelize";

const globalForSequelize = globalThis as unknown as {
  sequelize: Sequelize | undefined;
};

function createSequelize(): Sequelize {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Sequelize(databaseUrl, {
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  });
}

/** Returns a process-wide Sequelize client so serverless invocations reuse the pool. */
export function getSequelize(): Sequelize {
  if (!globalForSequelize.sequelize) {
    globalForSequelize.sequelize = createSequelize();
  }

  return globalForSequelize.sequelize;
}
