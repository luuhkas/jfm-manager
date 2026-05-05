const { BrowserWindow } = require("electron");
const fs = require("fs");

function registerPdfIpc(ipcMain, { dialog }) {
  ipcMain.handle("pdf:generate", async (_evt, { html, filename }) => {
    const win = new BrowserWindow({
      show: false,
      width: 794,
      height: 1123,
      webPreferences: { contextIsolation: true, javascript: false },
    });

    try {
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: filename ?? "relatorio.pdf",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      fs.writeFileSync(filePath, pdfBuffer);
      return { success: true, filePath };
    } finally {
      win.close();
    }
  });
}

module.exports = { registerPdfIpc };
