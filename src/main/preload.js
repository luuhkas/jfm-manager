const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("jfm", {
  database: {
    backup: () => ipcRenderer.invoke("database:backup"),
    restore: () => ipcRenderer.invoke("database:restore"),
  },
  audit: {
    listByRange: (range) => ipcRenderer.invoke("audit:listByRange", range),
  },
  employees: {
    list: () => ipcRenderer.invoke("employees:list"),
    upsertMany: (employees) => ipcRenderer.invoke("employees:upsertMany", employees),
    deleteIfUnused: (id) => ipcRenderer.invoke("employees:deleteIfUnused", id),
  },
  ponto: {
    listByDate: (workDate) => ipcRenderer.invoke("ponto:listByDate", workDate),
    listByRange: (range) => ipcRenderer.invoke("ponto:listByRange", range),
    addEvent: (event) => ipcRenderer.invoke("ponto:addEvent", event),
    deleteEvent: (id) => ipcRenderer.invoke("ponto:deleteEvent", id),
    listAdjustmentsByRange: (range) => ipcRenderer.invoke("ponto:listAdjustmentsByRange", range),
    addAdjustment: (adjustment) => ipcRenderer.invoke("ponto:addAdjustment", adjustment),
  },
  holidays: {
    listByRange: (range) => ipcRenderer.invoke("holidays:listByRange", range),
    upsert: (holiday) => ipcRenderer.invoke("holidays:upsert", holiday),
    delete: (id) => ipcRenderer.invoke("holidays:delete", id),
  },
  monthClosings: {
    get: (monthKey) => ipcRenderer.invoke("monthClosings:get", monthKey),
    close: (closing) => ipcRenderer.invoke("monthClosings:close", closing),
    reopen: (monthKey) => ipcRenderer.invoke("monthClosings:reopen", monthKey),
  },
  hourBank: {
    listByEmployee: (employeeId) => ipcRenderer.invoke("hourBank:listByEmployee", employeeId),
    listAll: () => ipcRenderer.invoke("hourBank:listAll"),
    add: (entry) => ipcRenderer.invoke("hourBank:add", entry),
    delete: (id) => ipcRenderer.invoke("hourBank:delete", id),
  },
  workOrders: {
    list: (filters) => ipcRenderer.invoke("workOrders:list", filters),
    upsert: (wo) => ipcRenderer.invoke("workOrders:upsert", wo),
    delete: (id) => ipcRenderer.invoke("workOrders:delete", id),
    nextNumber: () => ipcRenderer.invoke("workOrders:nextNumber"),
  },
  settings: {
    get: (key) => ipcRenderer.invoke("settings:get", key),
    getAll: () => ipcRenderer.invoke("settings:getAll"),
    set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
    setMany: (entries) => ipcRenderer.invoke("settings:setMany", entries),
  },
  pdf: {
    generate: (payload) => ipcRenderer.invoke("pdf:generate", payload),
  },
  esocial: {
    generateS1200: (payload) => ipcRenderer.invoke("esocial:generateS1200", payload),
  },
  salaryHistory: {
    listByEmployee: (employeeId) => ipcRenderer.invoke("salaryHistory:listByEmployee", employeeId),
  },
});
