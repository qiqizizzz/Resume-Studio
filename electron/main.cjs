const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const getResumePath = () => path.join(app.getPath("userData"), "resume-data.json");

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1180,
    minHeight: 720,
    backgroundColor: "#eef2f4",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  else window.loadURL("http://127.0.0.1:5173");
};

app.whenReady().then(() => {
  ipcMain.handle("resume:load", async () => {
    try {
      return JSON.parse(await fs.readFile(getResumePath(), "utf8"));
    } catch {
      return null;
    }
  });

  ipcMain.handle("resume:save", async (_event, resume) => {
    await fs.writeFile(getResumePath(), JSON.stringify(resume, null, 2), "utf8");
    return true;
  });

  ipcMain.handle("resume:backup", async (_event, resume) => {
    const result = await dialog.showSaveDialog({
      title: "备份简历数据",
      defaultPath: "我的简历.resume.json",
      filters: [{ name: "Resume Studio 数据", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) return false;
    await fs.writeFile(result.filePath, JSON.stringify(resume, null, 2), "utf8");
    return true;
  });

  ipcMain.handle("resume:import-data", async () => {
    const result = await dialog.showOpenDialog({
      title: "导入简历数据",
      properties: ["openFile"],
      filters: [{ name: "JSON 数据", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const filePath = result.filePaths[0];
    if (path.extname(filePath).toLowerCase() !== ".json") return { data: null, error: "format" };
    try {
      return { data: JSON.parse(await fs.readFile(filePath, "utf8")), error: null };
    } catch {
      return { data: null, error: "json" };
    }
  });

  ipcMain.handle("resume:select-avatar", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择头像",
      properties: ["openFile"],
      filters: [{ name: "图片", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const filePath = result.filePaths[0];
    const extension = path.extname(filePath).toLowerCase().replace(".", "") || "png";
    const mime = extension === "jpg" ? "jpeg" : extension;
    const data = await fs.readFile(filePath);
    return `data:image/${mime};base64,${data.toString("base64")}`;
  });

  ipcMain.handle("resume:export-pdf", async (event, fileName) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return false;
    const result = await dialog.showSaveDialog({
      title: "导出 PDF 简历",
      defaultPath: `${fileName || "我的简历"}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (result.canceled || !result.filePath) return false;
    const pdf = await window.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: "none" },
    });
    await fs.writeFile(result.filePath, pdf);
    return true;
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
