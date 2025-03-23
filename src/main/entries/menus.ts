import { FilePickerHelper } from "zotero-plugin-toolkit";
import { getString } from "../../utils/locale";

export { registerMenus };

function registerMenus() {
  ztoolkit.Menu.register("menuTools", { tag: "menuseparator" });
  ztoolkit.Menu.register("menuTools", {
    tag: "menuitem",
    label: getString("menuTools-monitor"),
    icon: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`,
    commandListener: async (ev) => {
      await addon.api.profiler.getAndProcessProfileData({
        openMonitor: true,
      });

      (addon.data.processor.monitor?.target as Window).focus();
    },
  });

  ztoolkit.Menu.register("menuTools", {
    tag: "menuitem",
    label: getString("menuTools-memory"),
    icon: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`,
    commandListener: (ev) => {
      Zotero.openInViewer("about:memory");
    },
  });

  ztoolkit.Menu.register("menuTools", {
    tag: "menuitem",
    label: getString("menuTools-startRecord"),
    icon: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`,
    isHidden: () => !!addon.data.processor.recordDir,
    commandListener: async (ev) => {
      const dir = await new FilePickerHelper(
        "Save log file to...",
        "folder",
      ).open();
      if (!dir) {
        return;
      }
      addon.data.processor.recordDir = dir;
    },
  });

  ztoolkit.Menu.register("menuTools", {
    tag: "menuitem",
    label: getString("menuTools-stopRecord"),
    icon: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`,
    isHidden: () => !addon.data.processor.recordDir,
    commandListener: async (ev) => {
      addon.data.processor.recordDir = undefined;
    },
  });
}
