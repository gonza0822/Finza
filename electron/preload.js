const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("caminoDesktop", {
  isDesktop: true,
});
