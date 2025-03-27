import { getPref } from "../utils/prefs";
import {
  startProfiler,
  getAndProcessProfileData,
  queueProfilerUpdate,
  stopProfiler,
} from "../modules/profiler";

export { registerProfiler, unregisterProfiler };

async function registerProfiler() {
  await startProfiler();

  if (getPref("openMonitorOnStart")) {
    await getAndProcessProfileData({ openMonitor: true, updateStatus: true });
  }

  queueProfilerUpdate();
}

async function unregisterProfiler() {
  await stopProfiler();
}
