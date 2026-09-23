const path = require("path");
const { config } = require("dotenv");
const { mysqlDialectOptions } = require("./mysqlSsl.cjs");

if (process.env.FINZA_AIVEN !== "1") {
  config({ path: path.resolve(process.cwd(), ".env.local") });
  config({ path: path.resolve(process.cwd(), ".env") });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

const mysql = {
  url: databaseUrl,
  dialect: "mysql",
  dialectOptions: mysqlDialectOptions(databaseUrl),
  define: {
    underscored: true,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
};

module.exports = {
  development: mysql,
  test: mysql,
  production: mysql,
};
