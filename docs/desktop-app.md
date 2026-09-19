# LifeGuard Desktop Window Application

The LifeGuard Desktop Window Application is built using Electron & TypeScript to provide a continuous, desktop-native risk sentinel that sits on the user's desktop without depending on a web browser tab.

---

## Key Features

1. **Native Windowing**:
   - Clean dark-frosted desktop window (1280x850 resolution).
   - Can be minimized to the system notification area/tray or kept open.

2. **Native OS Notifications**:
   - When an active risk is detected or when an action requires explicit human approval (`tool.approval_required`), LifeGuard emits a native Windows OS desktop notification popup.
   - Clicking the notification immediately restores and focuses the desktop window.

3. **IPC Bridge (`preload.ts`)**:
   - Safely bridges renderer IPC events (`sendNotification`, `focusWindow`) to the main process via `contextBridge`.

---

## Launch Commands

Launch Desktop App standalone:
```bash
npm run dev:desktop
```

Launch complete system stack (Backend + MCP + Desktop App):
```bash
bash sh_scripts/05_run_all.sh
```
