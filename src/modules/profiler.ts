import { ParsedData, Filter, ParsedResult } from "../extras/analyzer";
import { closeAnalyzer, getAnalyzer } from "../utils/analyzer";
import { getMonitor } from "../utils/monitor";
import { getPref } from "../utils/prefs";
import { updateStatusButton } from "../utils/status";
import { isWindowAlive } from "../utils/window";

export {
  startProfiler,
  stopProfiler,
  getProfileData,
  getAndProcessProfileData,
  queueUpdate,
};

let _AddonManager: AddonManager | undefined = undefined;

let profilerStarted = false;
let lastTime = -1;

const defaultSettings = {
  entries: 1000000,
  duration: 0,
  interval: 1,
  features: [
    "js",
    "stackwalk",
    "cpu",
    "responsiveness",
    "processcpu",
    "memory",
  ],
  threads: ["GeckoMain"],
  activeTabID: Zotero.getMainWindow().browsingContext.browserId,
};

async function startProfiler(settings: any = {}) {
  settings = Object.assign({}, defaultSettings, settings);

  await Services.profiler.StartProfiler(
    settings.entries,
    settings.interval,
    settings.features,
    settings.threads,
    settings.activeTabID,
    settings.duration,
  );

  lastTime = getTime();

  profilerStarted = true;
}

async function getProfileData() {
  if (!profilerStarted) {
    return null;
  }
  const profileData = await Services.profiler.getProfileDataAsync();
  return profileData;
}

async function getAddonInfo(): Promise<Filter[]> {
  if (!_AddonManager) {
    // @ts-ignore import is not typed
    _AddonManager = ChromeUtils.import(
      "resource://gre/modules/AddonManager.jsm",
    ).AddonManager;
  }

  // @ts-ignore getAllAddons is not typed
  const addons = (await _AddonManager.getAllAddons()) as any[];
  return addons
    .filter((addon) => addon.type === "extension" && addon.isActive)
    .map((addon) => ({
      key: addon.getResourceURI().spec,
      name: addon.name,
      description: `Plugin "${addon.name}" activities. This is a third-party plugin.`,
    }));
}

async function getAndProcessProfileData(
  options: {
    openMonitor?: boolean;
    updateMonitor?: boolean;
    updateStatus?: boolean;
    minimal?: boolean;
  } = {},
) {
  const {
    openMonitor = false,
    updateMonitor = false,
    updateStatus = false,
  } = options;
  let { minimal } = options;
  const canUpdateMonitor = isWindowAlive(
    addon.data.processor.monitor?.target as Window,
  );

  // If the monitor is not open and cannot be updated, we should only display minimal results.
  if (
    !openMonitor &&
    updateMonitor &&
    !canUpdateMonitor &&
    typeof minimal === "undefined"
  ) {
    minimal = true;
  }

  const profileData = await getProfileData();
  const duration = getTime() - lastTime;
  if (!profileData) {
    return null;
  }
  await Services.profiler.StopProfiler();
  profilerStarted = false;
  const server = await getAnalyzer();
  const addonInfo = await getAddonInfo();
  const result = await server.proxy.analyze(profileData, {
    keys: minimal
      ? []
      : [
          ...addonInfo,
          {
            key: "/extensions/",
            name: "Unknown Plugin",
            description:
              "From disabled or uninstalled plugins. Activities of this type indicates an issue with the plugin.",
          },
          {
            key: "chrome://zotero/",
            name: "Zotero - Main",
            description: "Zotero main thread activities.",
          },
          {
            key: "resource://zotero/reader",
            name: "Zotero - Reader",
            description: "Zotero reader activities.",
          },
          {
            key: "resource://zotero/note-editor",
            name: "Zotero - Note Editor",
            description: "Zotero note editor activities.",
          },
          {
            key: "resource://zotero/",
            name: "Zotero - Other",
            description: "Other Zotero activities.",
          },
        ],
    includeDetailedResults: minimal,
    disallowMultiple: true,
    duration,
  });

  await startProfiler();

  if (openMonitor || (updateMonitor && canUpdateMonitor)) {
    await displayProfileData(result);
  }

  if (updateStatus) {
    updateStatusButton(result);
  }

  return result;
}

async function displayProfileData(result: ParsedResult) {
  const server = await getMonitor();
  await server.proxy.display(result);
}

async function stopProfiler() {
  await Services.profiler.StopProfiler();
  closeAnalyzer();
  profilerStarted = false;
}

function queueUpdate() {
  if (!addon.data.alive || !isWindowAlive(Zotero.getMainWindow())) {
    return;
  }
  const period = getPref("updatePeriod");
  if (!period || typeof period !== "number") {
    return;
  }
  setTimeout(async () => {
    await getAndProcessProfileData({
      updateMonitor: true,
      updateStatus: true,
    });
    queueUpdate();
  }, period * 1000);
}

function getTime() {
  return Zotero.getMainWindow()?.performance?.now() || new Date().getTime();
}
