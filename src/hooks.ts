import { initMenus } from "./modules/menus";
import { registerPrefsPane } from "./modules/preferences";
import {
  getAndProcessProfileData,
  queueUpdate,
  startProfiler,
  stopProfiler,
} from "./modules/profiler";
import { initStatusButton } from "./modules/status";
import { initLocale } from "./utils/locale";
import { getPref } from "./utils/prefs";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  registerPrefsPane();

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
}

async function onMainWindowLoad(win: Window): Promise<void> {
  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  ztoolkit.UI.appendElement(
    {
      tag: "link",
      namespace: "html",
      properties: {
        rel: "stylesheet",
        href: `chrome://${addon.data.config.addonRef}/content/mainWindow.css`,
      },
      skipIfExists: true,
    },
    win.document.documentElement,
  );

  await startProfiler();

  initStatusButton(win);

  if (getPref("openMonitorOnStart")) {
    await getAndProcessProfileData({ openMonitor: true, updateStatus: true });
  }

  queueUpdate();

  initMenus();
}

async function onMainWindowUnload(win: Window): Promise<void> {
  await stopProfiler();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  // @ts-ignore - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
};
