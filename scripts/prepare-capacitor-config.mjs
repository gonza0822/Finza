import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_PROD_URL = "https://finza-blond.vercel.app";

/** Writes the Vercel URL Capacitor will load; refuses localhost. */
function main() {
  const appUrl = process.env.CAMINO_APP_URL || DEFAULT_PROD_URL;
  let host = "";
  try {
    host = new URL(appUrl).hostname;
  } catch {
    console.error("CAMINO_APP_URL must be a valid https URL.");
    process.exit(1);
  }
  if (host === "localhost" || host === "127.0.0.1") {
    console.error("Do not sync Capacitor against localhost. Set CAMINO_APP_URL to the Vercel URL.");
    process.exit(1);
  }
  const dest = resolve(process.cwd(), "capacitor/app-config.json");
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify({ appUrl }, null, 2)}\n`);
}

main();
