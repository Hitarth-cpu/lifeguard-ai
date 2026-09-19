import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send("notify", { title, body });
  },
  focusWindow: () => {
    ipcRenderer.send("focus-window");
  }
});
