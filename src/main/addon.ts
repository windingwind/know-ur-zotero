import { config } from "../../package.json";
import { MessageHelper } from "zotero-plugin-toolkit";
import hooks from "./hooks";
import { createZToolkit } from "../utils/ztoolkit";
import { handlers as analyzerHandlers } from "../workers/analyzer";
import { handlers as monitorHandlers } from "../html/monitor";
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
      analyzer?: MessageHelper<typeof analyzerHandlers>;
      monitor?: MessageHelper<typeof monitorHandlers>;
      recordDir?: string;
    };
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
    };
    this.hooks = hooks;
    this.api = api;
  }
}

export default Addon;
