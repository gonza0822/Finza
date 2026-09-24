const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const DEFAULT_PROD_URL = "https://finza-blond.vercel.app";
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** Reads the baked production URL written at electron:build time. */
function readBakedAppUrl() {
  try {
    return require("./app-config.json").appUrl;
  } catch {
    return "";
  }
}

/** True when the URL is this machine (must never ship inside the installer). */
function isLocalhost(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/.test(url);
  }
}

/** Dev → local Next; packaged → Vercel. Refuses localhost in a built app. */
function resolveAppUrl() {
  if (!app.isPackaged) {
    return process.env.AUTH_URL || process.env.CAMINO_APP_URL || "http://localhost:3000";
  }
  const url = process.env.CAMINO_APP_URL || readBakedAppUrl() || DEFAULT_PROD_URL;
  if (!url || isLocalhost(url)) {
    throw new Error("Packaged Finza must load CAMINO_APP_URL (the Vercel site), not localhost.");
  }
  return url;
}

/** App host plus Google so OAuth can complete inside the window. */
function isAllowedNavigation(targetUrl, appUrl) {
  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return false;
  }
  const appHost = new URL(appUrl).hostname;
  const host = target.hostname;
  return (
    host === appHost ||
    host === "accounts.google.com" ||
    host.endsWith(".google.com") ||
    host.endsWith(".googleapis.com")
  );
}

/** Opens Finza in a sandboxed window; unknown links go to the system browser. */
function createWindow() {
  const appUrl = resolveAppUrl();
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 560,
    title: "Finza",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setUserAgent(CHROME_UA);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url, appUrl)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url, appUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.loadURL(appUrl);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
