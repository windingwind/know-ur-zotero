import { registerMainWindowResource } from "./entries/mainWindow";
import { registerMenus } from "./entries/menus";
import { registerPrefsPane } from "./entries/preferences";
import { registerProfiler, unregisterProfiler } from "./entries/profiler";
import { registerStatusButton } from "./entries/status";
import { updateCPUCount } from "./modules/system";
import { initLocale } from "./utils/locale";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  registerPrefsPane();

  updateCPUCount();

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
}

async function onMainWindowLoad(win: Window): Promise<void> {
  registerMainWindowResource(win);

  await registerProfiler();

  registerStatusButton(win);

  registerMenus();
}

async function onMainWindowUnload(win: Window): Promise<void> {
  await unregisterProfiler();
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
