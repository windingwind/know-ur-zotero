import { config } from "../../package.json";
import { MessageHelper } from "zotero-plugin-toolkit";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";
import api from "./api";

class Addon {
  public data: {
    alive: boolean;
    config: typeof config;
    // Env type, see build.js
    env: "development" | "production";
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
    processor: {
      analyzer?: MessageHelper<_PluginTypes.Analyzer.Handlers>;
      monitor?: MessageHelper<_PluginTypes.Monitor.Handlers>;
      recordDir?: string;
    };
    cpuCount?: number;
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: typeof api;

  constructor() {
    this.data = {
      alive: true,
      config,
      env: __env__,
      ztoolkit: createZToolkit(),
      processor: {},
      cpuCount: undefined,
    };
    this.hooks = hooks;
    this.api = api;
  }
}

export default Addon;
