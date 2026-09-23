const { spawnSync } = require("child_process");
const path = require("path");
const { config } = require("dotenv");

const loaded = config({ path: path.resolve(process.cwd(), ".env.aiven"), override: true });
if (loaded.error || !process.env.DATABASE_URL) {
  console.error("Create .env.aiven with DATABASE_URL from Aiven Overview. Do not commit that file.");
  process.exit(1);
}

process.env.FINZA_AIVEN = "1";

/** Runs sequelize-cli with the Aiven URL already in the environment. */
function run(args) {
  const result = spawnSync("npx", ["sequelize-cli", ...args], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(["db:migrate"]);
run(["db:seed:all"]);
