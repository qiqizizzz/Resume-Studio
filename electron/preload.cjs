const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("resumeStudio", {
  load: () => ipcRenderer.invoke("resume:load"),
  save: (resume) => ipcRenderer.invoke("resume:save", resume),
  backup: (resume) => ipcRenderer.invoke("resume:backup", resume),
  importData: () => ipcRenderer.invoke("resume:import-data"),
  selectAvatar: () => ipcRenderer.invoke("resume:select-avatar"),
  exportPdf: (fileName) => ipcRenderer.invoke("resume:export-pdf", fileName),
});
