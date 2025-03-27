import { MessageHelper } from "zotero-plugin-toolkit";

export { closeAnalyzer, getAnalyzer };

function closeAnalyzer() {
  if (addon.data.processor.analyzer) {
    addon.data.processor.analyzer.destroy();
    addon.data.processor.analyzer = undefined;
  }
}

async function getAnalyzer() {
  if (addon.data.processor.analyzer) {
    return addon.data.processor.analyzer;
  }
  const worker = new Worker(
    `chrome://${addon.data.config.addonRef}/content/scripts/analyzer.js`,
    { name: "kuz-analyzer" },
  );
  const server = new MessageHelper<_PluginTypes.Analyzer.Handlers>({
    canBeDestroyed: false,
    dev: __env__ === "development",
    name: "analyzerWorkerMain",
    target: worker,
    handlers: {},
  });
  server.start();
  await server.proxy._ping();
  addon.data.processor.analyzer = server;
  return server;
}
