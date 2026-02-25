const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  });

  win.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`
        <h1>JFM Manager</h1>
        <p>Sistema iniciado 🚀</p>
      `)
  );
}

app.whenReady().then(createWindow);