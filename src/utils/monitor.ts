import { MessageHelper } from "zotero-plugin-toolkit";
import { handlers } from "../extras/monitor";
import { isWindowAlive } from "./window";

export { closeMonitor, getMonitor };

function closeMonitor() {
  if (addon.data.processor.monitor) {
    addon.data.processor.monitor.destroy();
    addon.data.processor.monitor = undefined;
  }
}

async function getMonitor() {
  if (
    addon.data.processor.monitor &&
    isWindowAlive(addon.data.processor.monitor.target as Window)
  ) {
    return addon.data.processor.monitor;
  }
  const args = {
    _initPromise: Zotero.Promise.defer(),
  };
  const worker = Services.ww.openWindow(
    // @ts-ignore
    null,
    `chrome://${addon.data.config.addonRef}/content/monitor/monitor.html`,
    "kuz-monitor",
    "chrome,centerscreen,resizable=yes",
    args,
  );
  await args._initPromise.promise;
  const server = new MessageHelper<typeof handlers>({
    canBeDestroyed: false,
    dev: __env__ === "development",
    name: "monitorWorkerMain",
    target: worker as Window,
    handlers: {},
  });
  server.start();
  await server.proxy._ping();
  addon.data.processor.monitor = server;
  return server;
}
